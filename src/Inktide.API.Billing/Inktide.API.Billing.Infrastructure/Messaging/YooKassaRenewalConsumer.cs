using System.Diagnostics;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Inktide.API.Billing.Application.Messages;
using Inktide.API.Billing.Infrastructure.Settings;
using Inktide.API.Billing.Infrastructure.Telemetry;
using Inktide.API.Core.Generators;
using MassTransit;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Billing.Infrastructure.Messaging;

public sealed class YooKassaRenewalConsumer : IConsumer<YooKassaRenewalRequestedMessage>
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly YooKassaSettings _settings;
    private readonly IConnectionMultiplexer _redis;
    private readonly TimeProvider _time;
    private readonly BillingMetrics _metrics;
    private readonly ILogger<YooKassaRenewalConsumer> _logger;

    public YooKassaRenewalConsumer(
        IHttpClientFactory httpClientFactory,
        YooKassaSettings settings,
        IConnectionMultiplexer redis,
        TimeProvider time,
        BillingMetrics metrics,
        ILogger<YooKassaRenewalConsumer> logger)
    {
        _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
        _settings          = settings          ?? throw new ArgumentNullException(nameof(settings));
        _redis             = redis             ?? throw new ArgumentNullException(nameof(redis));
        _time              = time              ?? throw new ArgumentNullException(nameof(time));
        _metrics           = metrics           ?? throw new ArgumentNullException(nameof(metrics));
        _logger            = logger            ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task Consume(ConsumeContext<YooKassaRenewalRequestedMessage> context)
    {
        var msg        = context.Message;
        var ct         = context.CancellationToken;
        var db         = _redis.GetDatabase();
        var periodUnix = ((DateTimeOffset)msg.PeriodEnd).ToUnixTimeSeconds();
        var idempKey   = $"billing:renewal:attempt:{msg.UserId}:{periodUnix}";

        var isStarter   = msg.Plan.Equals("Starter", StringComparison.OrdinalIgnoreCase);
        var amount      = isStarter ? _settings.StarterPriceAmount : _settings.ProPriceAmount;
        var description = isStarter
            ? $"{_settings.StarterDescription} (автопродление)"
            : $"{_settings.ProDescription} (автопродление)";

        var body = new JsonObject
        {
            ["amount"] = new JsonObject
            {
                ["value"]    = amount,
                ["currency"] = _settings.PriceCurrency,
            },
            ["capture"]             = true,
            ["payment_method_id"]   = msg.ProviderSubId,
            ["save_payment_method"] = true,
            ["description"]         = description,
            ["metadata"]            = new JsonObject
            {
                ["user_id"] = msg.UserId,
                ["plan"]    = msg.Plan.ToLowerInvariant(),
            },
        };

        var sw = Stopwatch.StartNew();
        var (paymentId, permanent, lastError) = await TryChargeAsync(body, ct).ConfigureAwait(false);
        _metrics.RenewalDurationMs.Record(sw.Elapsed.TotalMilliseconds);

        if (paymentId is not null)
        {
            await db.StringSetAsync(idempKey, paymentId, TimeSpan.FromHours(48)).ConfigureAwait(false);
            _logger.LogInformation(
                "YooKassaRenewalConsumer: auto-renewal initiated for user {UserId}, paymentId={PaymentId}",
                msg.UserId, paymentId);
            return;
        }

        if (permanent)
        {
            // 4xx = card declined / invalid payment method — do not retry via MT
            await db.StringSetAsync(idempKey, "failed:4xx", TimeSpan.FromHours(48)).ConfigureAwait(false);
            _logger.LogWarning(
                "YooKassaRenewalConsumer: permanent failure for user {UserId}: {Error}",
                msg.UserId, lastError);
            return;
        }

        // 5xx / network error — throw so MT retries with exponential backoff
        throw new InvalidOperationException(
            $"YooKassa renewal transient failure for user {msg.UserId}: {lastError}");
    }

    private async Task<(string? PaymentId, bool Permanent, string? Error)> TryChargeAsync(
        JsonObject body, CancellationToken ct)
    {
        var http = _httpClientFactory.CreateClient("yookassa-renewal");

        using var content = new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json");
        using var req     = new HttpRequestMessage(HttpMethod.Post, "/v3/payments") { Content = content };
        req.Headers.Add("Idempotency-Key", IdGenerator.New().ToString());

        HttpResponseMessage response;
        try
        {
            response = await http.SendAsync(req, ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            return (null, false, ex.Message);
        }

        var json = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

        if (response.IsSuccessStatusCode)
        {
            using var doc = JsonDocument.Parse(json);
            var id = doc.RootElement.TryGetProperty("id", out var idEl) ? idEl.GetString() : null;
            return (id, false, null);
        }

        int code = (int)response.StatusCode;
        _logger.LogWarning("YooKassaRenewalConsumer: YooKassa returned {Status}: {Body}", code, json);
        bool permanent = code is >= 400 and < 500;
        return (null, permanent, $"HTTP {code}");
    }
}

public sealed class YooKassaRenewalFaultConsumer : IConsumer<Fault<YooKassaRenewalRequestedMessage>>
{
    private readonly ILogger<YooKassaRenewalFaultConsumer> _logger;

    public YooKassaRenewalFaultConsumer(ILogger<YooKassaRenewalFaultConsumer> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public Task Consume(ConsumeContext<Fault<YooKassaRenewalRequestedMessage>> context)
    {
        var msg = context.Message.Message;
        _logger.LogError(
            "YooKassa renewal permanently failed for user {UserId}, plan {Plan}, periodEnd {PeriodEnd} — moved to error queue",
            msg.UserId, msg.Plan, msg.PeriodEnd);
        return Task.CompletedTask;
    }
}
