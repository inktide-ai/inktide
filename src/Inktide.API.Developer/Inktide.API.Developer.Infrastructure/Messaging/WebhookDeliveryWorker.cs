using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Inktide.API.Developer.Domain.Entities;
using Inktide.API.Developer.Domain.Repositories;
using Inktide.API.Developer.Infrastructure.Settings;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Developer.Infrastructure.Messaging;

internal sealed class WebhookDeliveryWorker : BackgroundService
{
    private const string ConsumerGroupName = "webhook-workers";
    private const string StreamName = "platform.webhook.events";
    private static readonly TimeSpan[] RetryDelays =
    [
        TimeSpan.FromSeconds(1),
        TimeSpan.FromSeconds(5),
        TimeSpan.FromSeconds(30),
        TimeSpan.FromMinutes(5),
        TimeSpan.FromMinutes(30),
    ];

    private readonly IConnectionMultiplexer _redis;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHttpClientFactory _httpFactory;
    private readonly DeveloperSettings _settings;
    private readonly ILogger<WebhookDeliveryWorker> _logger;
    private readonly string _consumerName;

    public WebhookDeliveryWorker(
        IConnectionMultiplexer redis,
        IServiceScopeFactory scopeFactory,
        IHttpClientFactory httpFactory,
        DeveloperSettings settings,
        ILogger<WebhookDeliveryWorker> logger)
    {
        _redis        = redis        ?? throw new ArgumentNullException(nameof(redis));
        _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
        _httpFactory  = httpFactory  ?? throw new ArgumentNullException(nameof(httpFactory));
        _settings     = settings     ?? throw new ArgumentNullException(nameof(settings));
        _logger       = logger       ?? throw new ArgumentNullException(nameof(logger));
        _consumerName = $"webhook-worker-{Environment.MachineName}-{Environment.ProcessId}";
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            var db = _redis.GetDatabase();
            await EnsureConsumerGroupAsync(db, stoppingToken);

            _logger.LogInformation(
                "WebhookDeliveryWorker started. Stream={Stream} Group={Group} Consumer={Consumer}",
                StreamName, ConsumerGroupName, _consumerName);

            await Task.WhenAll(
                ConsumeLoopAsync(db, stoppingToken),
                AutoClaimLoopAsync(db, stoppingToken));
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("WebhookDeliveryWorker cancelled.");
        }
    }

    private async Task ConsumeLoopAsync(IDatabase db, CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                var entries = await db.StreamReadGroupAsync(
                    StreamName, ConsumerGroupName, _consumerName,
                    position: null, count: _settings.ReadCount, noAck: false);

                if (entries.Length == 0)
                {
                    await Task.Delay(500, ct);
                    continue;
                }

                foreach (var entry in entries)
                    await ProcessEntryAsync(db, entry, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch (RedisException ex)
            {
                _logger.LogWarning(ex, "WebhookDeliveryWorker: Redis error. Retrying in 5s.");
                await Task.Delay(5_000, ct);
            }
        }
    }

    private async Task AutoClaimLoopAsync(IDatabase db, CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(_settings.AutoClaimMinIdleMs, ct);

                var claimed = await db.StreamAutoClaimAsync(
                    StreamName, ConsumerGroupName, _consumerName,
                    _settings.AutoClaimMinIdleMs, "0-0",
                    count: _settings.AutoClaimBatchSize);

                foreach (var entry in claimed.ClaimedEntries)
                    await ProcessEntryAsync(db, entry, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch (RedisException ex)
            {
                _logger.LogWarning(ex, "WebhookDeliveryWorker: Redis error in auto-claim loop.");
                await Task.Delay(5_000, ct);
            }
        }
    }

    private async Task ProcessEntryAsync(IDatabase db, StreamEntry entry, CancellationToken ct)
    {
        try
        {
            // Scoped repositories must not be captured as singletons — create a fresh scope per message.
            using var scope      = _scopeFactory.CreateScope();
            var deliveryRepo     = scope.ServiceProvider.GetRequiredService<IWebhookDeliveryRepository>();
            var appRepo          = scope.ServiceProvider.GetRequiredService<IDeveloperApplicationRepository>();

            var fields = entry.Values.ToDictionary(v => v.Name.ToString(), v => v.Value.ToString());

            fields.TryGetValue("event_type", out var eventType);
            fields.TryGetValue("payload_json", out var payloadJson);
            fields.TryGetValue("connector_slug", out var connectorSlug);

            // Resolve target applications
            var targets = new List<(Guid AppId, string WebhookUrl, string SecretHash)>();

            if (fields.TryGetValue("application_id", out var appIdStr)
                && Guid.TryParse(appIdStr, out var appId)
                && fields.TryGetValue("webhook_url", out var wUrl)
                && !string.IsNullOrWhiteSpace(wUrl))
            {
                fields.TryGetValue("webhook_secret_hash", out var sh);
                targets.Add((appId, wUrl, sh ?? string.Empty));
            }
            else if (!string.IsNullOrWhiteSpace(connectorSlug))
            {
                var apps = await appRepo.GetByConnectorSlugAsync(connectorSlug, ct);
                foreach (var a in apps)
                {
                    if (!string.IsNullOrWhiteSpace(a.WebhookUrl))
                        targets.Add((a.Id, a.WebhookUrl!, a.WebhookSecretHash ?? string.Empty));
                }
            }

            if (targets.Count == 0)
            {
                await db.StreamAcknowledgeAsync(StreamName, ConsumerGroupName, entry.Id);
                return;
            }

            bool allSucceeded = true;
            foreach (var (targetAppId, webhookUrl, secretHash) in targets)
            {
                await DeliverToAppAsync(db, entry, targetAppId, webhookUrl, secretHash,
                    eventType, payloadJson, deliveryRepo, ct);
            }

            _ = allSucceeded;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "WebhookDeliveryWorker: error processing entry {EntryId}", entry.Id);
        }
    }

    private async Task DeliverToAppAsync(
        IDatabase db,
        StreamEntry entry,
        Guid applicationId,
        string webhookUrl,
        string webhookSecretHash,
        string? eventType,
        string? payloadJson,
        IWebhookDeliveryRepository deliveryRepo,
        CancellationToken ct)
    {
        var delivery = WebhookDelivery.Create(applicationId, eventType ?? "unknown", payloadJson ?? "{}");
        await deliveryRepo.AddAsync(delivery, ct);

        var (statusCode, responseBody) = await PostWebhookAsync(
            webhookUrl, payloadJson ?? "{}", webhookSecretHash, eventType ?? "unknown", ct);

        if (statusCode is >= 200 and < 300)
        {
            delivery.RecordSuccess(statusCode!.Value, responseBody);
            await db.StreamAcknowledgeAsync(StreamName, ConsumerGroupName, entry.Id);
        }
        else
        {
            if (delivery.Attempt >= _settings.MaxDeliveryAttempts)
            {
                delivery.RecordFailure(statusCode, responseBody, DateTime.MaxValue);
                await db.StreamAcknowledgeAsync(StreamName, ConsumerGroupName, entry.Id);
                _logger.LogWarning("Webhook delivery exhausted retries for app {AppId}", applicationId);
            }
            else
            {
                var delayIndex = Math.Min(delivery.Attempt - 1, RetryDelays.Length - 1);
                delivery.RecordFailure(statusCode, responseBody, DateTime.UtcNow + RetryDelays[delayIndex]);
            }
        }

        await deliveryRepo.UpdateAsync(delivery, ct);
    }

    private async Task<(int? StatusCode, string? Body)> PostWebhookAsync(
        string url, string payloadJson, string secretHash, string eventType, CancellationToken ct)
    {
        try
        {
            using var http = _httpFactory.CreateClient("WebhookDelivery");
            var bodyBytes = Encoding.UTF8.GetBytes(payloadJson);

            string signature = string.Empty;
            if (!string.IsNullOrWhiteSpace(secretHash))
            {
                var secretBytes = Convert.FromHexString(secretHash);
                var hmac = HMACSHA256.HashData(secretBytes, bodyBytes);
                signature = $"sha256={Convert.ToHexString(hmac).ToLowerInvariant()}";
            }

            using var req = new HttpRequestMessage(HttpMethod.Post, url);
            req.Content = new ByteArrayContent(bodyBytes);
            req.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            req.Headers.Add("X-Inktide-Event", eventType);
            if (!string.IsNullOrWhiteSpace(signature))
                req.Headers.Add("X-Inktide-Signature", signature);

            var res = await http.SendAsync(req, ct);
            var body = await res.Content.ReadAsStringAsync(ct);
            return ((int)res.StatusCode, body.Length > 500 ? body[..500] : body);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Webhook POST failed to {Url}", url);
            return (null, ex.Message);
        }
    }

    private static async Task EnsureConsumerGroupAsync(IDatabase db, CancellationToken ct)
    {
        try
        {
            await db.StreamCreateConsumerGroupAsync(
                StreamName, ConsumerGroupName, StreamPosition.Beginning, createStream: true);
        }
        catch (RedisServerException ex) when (ex.Message.Contains("BUSYGROUP"))
        {
            // Group already exists — idempotent
        }
    }
}
