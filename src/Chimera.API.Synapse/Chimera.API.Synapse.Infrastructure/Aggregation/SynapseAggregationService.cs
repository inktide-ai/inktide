using System.Text.Json;
using Chimera.API.Synapse.Application.Configuration;
using Chimera.API.Synapse.Application.Interfaces;
using Chimera.API.Synapse.Application.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Chimera.API.Synapse.Infrastructure.Aggregation;

/// <summary>Fan-in: publishes aggregated context envelope to the LLM Redis stream.</summary>
public sealed class SynapseAggregationService : ISynapseAggregationService
{
    #region Fields

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly IConnectionMultiplexer _redis;
    private readonly IOptions<SynapseAggregationOptions> _options;
    private readonly ILogger<SynapseAggregationService> _logger;

    #endregion

    #region Constructors

    public SynapseAggregationService(
        IConnectionMultiplexer redis,
        IOptions<SynapseAggregationOptions> options,
        ILogger<SynapseAggregationService> logger)
    {
        _redis = redis ?? throw new ArgumentNullException(nameof(redis));
        _options = options ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #endregion

    #region Public Methods

    public async Task AggregateAsync(MessageProcessingContext context, CancellationToken cancellationToken = default)
    {
        var envelope = new SynapseAggregatedEnvelope(
            context.TransportMessageId,
            string.IsNullOrEmpty(context.CorrelationId) ? context.TransportMessageId : context.CorrelationId,
            DateTimeOffset.UtcNow,
            context.Message,
            context.Get<RagContext>(),
            context.Get<ContextShardPayload>());

        var json = JsonSerializer.Serialize(envelope, JsonOptions);
        var opt = _options.Value;

        var db = _redis.GetDatabase();
        
        await db.StreamAddAsync(
            opt.LlmStreamName,
            [new NameValueEntry("payload", json)],
            maxLength: (int)opt.ApproximateMaxLength,
            useApproximateMaxLength: true,
            flags: CommandFlags.None);

        _logger.LogInformation(
            "Envelope published to LLM stream. Stream={Stream} Correlation={Correlation}",
            opt.LlmStreamName,
            envelope.CorrelationId);
    }

    #endregion
}
