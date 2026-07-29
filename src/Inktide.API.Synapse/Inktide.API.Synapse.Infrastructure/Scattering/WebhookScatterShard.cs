using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Constants;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Synapse.Infrastructure.Scattering;

/// <summary>
/// Tier-2 webhook shard: calls a user-registered external URL and injects the returned context
/// into the prompt as additional context text.
/// Hard-cancelled at 800 ms to stay within latency budget.
/// On any error or timeout, logs and continues silently - the pipeline must never block on user webhooks.
/// </summary>
internal sealed class WebhookScatterShard : IPipelineStage
{
    private const int TimeoutMs = 800;

    private readonly HttpClient _http;
    private readonly ILogger<WebhookScatterShard> _logger;

    public string ShardId => SynapseConstants.ShardIds.Webhook;

    public bool ShouldRun(AiCardContext? cardCtx)
        => SynapseConstants.PluginGate.IsEnabled(cardCtx?.Plugins, SynapseConstants.ShardIds.Webhook);

    public WebhookScatterShard(HttpClient http, ILogger<WebhookScatterShard> logger)
    {
        _http   = http   ?? throw new ArgumentNullException(nameof(http));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task ProcessAsync(MessageProcessingContext context, CancellationToken cancellationToken = default)
    {
        var cardCtx = context.Get<AiCardContext>();
        var webhook = cardCtx?.Plugins?
            .FirstOrDefault(p => p.PluginId == "webhook" && p.IsEnabled);

        if (webhook is null || !webhook.Config.TryGetValue("url", out var url) || string.IsNullOrWhiteSpace(url))
            return;

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeoutMs);

        try
        {
            var payload = new WebhookPayload(
                Message:   context.Message.Text,
                ChannelId: context.Message.ChannelId,
                SoulId:    cardCtx!.CharacterId.ToString(),
                Timestamp: DateTimeOffset.UtcNow);

            var response = await _http.PostAsJsonAsync(url, payload, cts.Token);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<WebhookResponse>(cts.Token);
            if (!string.IsNullOrWhiteSpace(result?.Context))
                context.Set(new WebhookContext(result.Context));

            _logger.LogDebug(
                "[Scatter:{ShardId}] Webhook responded in time. SoulId={SoulId} Correlation={Correlation}",
                ShardId, cardCtx.CharacterId, context.CorrelationId);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(
                "[Scatter:{ShardId}] Webhook timed out after {TimeoutMs}ms, skipping. Correlation={Correlation}",
                ShardId, TimeoutMs, context.CorrelationId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "[Scatter:{ShardId}] Webhook call failed, skipping. Correlation={Correlation}",
                ShardId, context.CorrelationId);
        }
    }

    private sealed record WebhookPayload(
        [property: JsonPropertyName("message")]   string Message,
        [property: JsonPropertyName("channel_id")] string ChannelId,
        [property: JsonPropertyName("soul_id")]    string SoulId,
        [property: JsonPropertyName("timestamp")]  DateTimeOffset Timestamp);

    private sealed record WebhookResponse(
        [property: JsonPropertyName("context")]   string? Context);
}
