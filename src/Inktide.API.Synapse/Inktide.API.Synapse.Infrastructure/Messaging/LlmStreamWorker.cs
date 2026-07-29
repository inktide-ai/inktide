using Inktide.API.Core.Messaging;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using Inktide.API.Synapse.Application.Configuration;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Constants;
using Inktide.API.Synapse.Infrastructure.Emotion;
using Inktide.API.Synapse.Infrastructure.Llm;
using Inktide.API.Synapse.Infrastructure.Providers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using StackExchange.Redis;

namespace Inktide.API.Synapse.Infrastructure.Messaging;

/// <summary>
/// Reads aggregated envelopes from <c>synapse.llm.ready</c>, calls the configured LLM provider
/// via Semantic Kernel, and publishes sentence-chunked responses to <c>synapse.llm.response</c>.
///
/// Replaces the Python fast-api/ai-worker/llm-worker. The published JSON shape is identical
/// so <see cref="LlmResponseStreamConsumer"/> in the TTS module requires no changes.
///
/// Provider selection: the AiCard's <c>LlmProviderId</c> is used as the Semantic Kernel service ID.
/// If that provider is not registered, the worker falls back to <see cref="LlmStreamSettings.FallbackProviderId"/>.
/// </summary>
internal sealed class LlmStreamWorker : RedisStreamConsumerBase
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IMemoryIngestionPort _memoryIngestion;
    private readonly IConversationHistoryRepository _history;
    private readonly Kernel _kernel;
    private readonly ChatServiceFactoryRegistry _factoryRegistry;
    private readonly SynapsePromptBuilder _promptBuilder;
    private readonly LlmStreamSettings _settings;
    private readonly ILogger<LlmStreamWorker> _logger;
    private readonly string _consumerName;

    private const int MaxHistoryTurns = 20;

    // Concurrency guard - controlled by LlmStreamSettings.MaxConcurrentRequests.
    private readonly SemaphoreSlim _llmSem;

    protected override string StreamName              => _settings.StreamIn;
    protected override string ConsumerGroup           => _settings.ConsumerGroup;
    protected override string ConsumerName            => _consumerName;
    protected override string PayloadFieldName        => _settings.PayloadFieldName;
    protected override int    ReadCount               => _settings.ReadCount;
    protected override int    ReadBlockMilliseconds   => _settings.ReadBlockMilliseconds;
    protected override long   AutoClaimMinIdleMs      => _settings.AutoClaimMinIdleMs;
    protected override int    AutoClaimBatchSize      => _settings.AutoClaimBatchSize;
    protected override int    AutoClaimLoopDelaySeconds => _settings.AutoClaimLoopDelaySeconds;

    public LlmStreamWorker(
        IConnectionMultiplexer redis,
        IServiceScopeFactory scopeFactory,
        IMemoryIngestionPort memoryIngestion,
        IConversationHistoryRepository history,
        Kernel kernel,
        ChatServiceFactoryRegistry factoryRegistry,
        SynapsePromptBuilder promptBuilder,
        IOptions<LlmStreamSettings> settings,
        ILogger<LlmStreamWorker> logger)
        : base(redis, logger)
    {
        _scopeFactory    = scopeFactory    ?? throw new ArgumentNullException(nameof(scopeFactory));
        _memoryIngestion = memoryIngestion ?? throw new ArgumentNullException(nameof(memoryIngestion));
        _history         = history         ?? throw new ArgumentNullException(nameof(history));
        _kernel          = kernel          ?? throw new ArgumentNullException(nameof(kernel));
        _factoryRegistry = factoryRegistry ?? throw new ArgumentNullException(nameof(factoryRegistry));
        _promptBuilder   = promptBuilder   ?? throw new ArgumentNullException(nameof(promptBuilder));
        _settings        = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        _logger          = logger          ?? throw new ArgumentNullException(nameof(logger));

        var concurrency = Math.Max(1, _settings.MaxConcurrentRequests);
        _llmSem = new SemaphoreSlim(concurrency, concurrency);

        _consumerName = $"{_settings.ConsumerNamePrefix}-{ResolveInstanceId()}";
    }


    // -------------------------------------------------------------------------
    // Per-message processing
    // -------------------------------------------------------------------------

    protected override async Task ProcessEntryAsync(IDatabase db, StreamEntry entry, CancellationToken ct)
    {
        var payloadJson = ReadField(entry, _settings.PayloadFieldName);
        if (payloadJson is null)
        {
            _logger.LogWarning("LlmStreamWorker: entry {Id} missing payload — discarding", entry.Id);
            await AckAsync(db, entry.Id);
            return;
        }

        SynapseAggregatedEnvelope? envelope;
        try
        {
            envelope = JsonSerializer.Deserialize<SynapseAggregatedEnvelope>(payloadJson, SynapseConstants.Json.Read);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "LlmStreamWorker: malformed envelope Id={Id} — discarding", entry.Id);
            await AckAsync(db, entry.Id);
            return;
        }

        if (envelope is null)
        {
            await AckAsync(db, entry.Id);
            return;
        }

        await _llmSem.WaitAsync(ct);
        try
        {
            await StreamAndPublishAsync(db, envelope, ct);
            await AckAsync(db, entry.Id);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "LlmStreamWorker: unhandled error. Correlation={Correlation}",
                envelope.CorrelationId);
            await HandleFailedEntryAsync(db, entry, ex);
        }
        finally
        {
            _llmSem.Release();
        }
    }


    // -------------------------------------------------------------------------
    // LLM streaming + sentence accumulation
    // -------------------------------------------------------------------------

    private async Task StreamAndPublishAsync(
        IDatabase db,
        SynapseAggregatedEnvelope envelope,
        CancellationToken ct)
    {
        var ctx        = envelope.Context;
        var providerId = ctx?.LlmProviderId ?? _settings.FallbackProviderId;
        var modelId    = ctx?.LlmModel;
        var userId     = ctx?.UserId ?? Guid.Empty;

        // Resolve chat completion service.
        // Priority: BYOK (user's own key) -> platform provider registered in Kernel.
        var chatService = await ResolveChatServiceAsync(providerId, modelId, userId, ctx?.LlmBaseUrl, ctx?.LlmRequiresApiKey ?? true, ct);

        // No BYOK - fall back to the platform provider registered in the Kernel (e.g. Ollama).
        if (chatService is null)
        {
            var fallbackId = _settings.FallbackProviderId;
            chatService = _kernel.Services.GetKeyedService<IChatCompletionService>(fallbackId);

            if (chatService is null)
            {
                _logger.LogWarning(
                    "LlmStreamWorker: no BYOK credential for user {UserId}/provider '{Provider}' " +
                    "and fallback provider '{Fallback}' is not registered — message skipped. Correlation={Correlation}",
                    userId, providerId, fallbackId, envelope.CorrelationId);
                return;
            }

            _logger.LogInformation(
                "LlmStreamWorker: using fallback provider '{Fallback}' (no BYOK). " +
                "User={UserId} Correlation={Correlation}",
                fallbackId, userId, envelope.CorrelationId);
        }

        var history = _promptBuilder.Build(envelope);

#pragma warning disable SKEXP0010 // OpenAIPromptExecutionSettings is experimental in some SK previews
        var execSettings = new OpenAIPromptExecutionSettings
        {
            ModelId          = string.IsNullOrEmpty(modelId) ? null : modelId,
            Temperature      = ctx?.LlmTemperature      ?? 0.7,
            MaxTokens        = ctx?.LlmMaxTokens        ?? 512,
            TopP             = ctx?.LlmTopP             ?? 0.9,
            FrequencyPenalty = ctx?.LlmFrequencyPenalty ?? 0,
            PresencePenalty  = ctx?.LlmPresencePenalty  ?? 0,
        };
#pragma warning restore SKEXP0010

        var mode = ctx?.ChunkingMode?.Equals("chat", StringComparison.OrdinalIgnoreCase) == true
            ? ChunkingMode.Chat
            : ChunkingMode.Narration;

        var responseDelayMs = ctx?.ResponseDelayMs ?? 0;
        var displayModel    = modelId ?? providerId;

        _logger.LogInformation(
            "LLM request started. User={User} Channel={Channel} Provider={Provider} Model={Model} Correlation={Correlation}",
            envelope.Message.Sender.UserName, envelope.Message.ChannelName,
            providerId, displayModel, envelope.CorrelationId);

        // Local token stream over SK streaming API.
        async IAsyncEnumerable<string> TokenStream([EnumeratorCancellation] CancellationToken cancel = default)
        {
            await foreach (var chunk in chatService
                               .GetStreamingChatMessageContentsAsync(history, execSettings, cancellationToken: cancel))
            {
                if (!string.IsNullOrEmpty(chunk.Content))
                    yield return chunk.Content;
            }
        }

        // Look-ahead buffer: hold each sentence until the next one arrives so the
        // final chunk always carries isLast=true and no empty terminal marker is published.
        var seq          = 0;
        string? pending  = null;
        var firstPublish = true;
        var firstLogged  = false;
        var fullResponse = new StringBuilder();

        await foreach (var sentence in SentenceAccumulator.AccumulateAsync(TokenStream(ct), mode, ct))
        {
            if (!firstLogged)
            {
                _logger.LogInformation(
                    "First sentence ready. Provider={Provider} Correlation={Correlation}",
                    providerId, envelope.CorrelationId);
                firstLogged = true;
            }

            if (pending is not null)
            {
                if (firstPublish && responseDelayMs > 0)
                {
                    await Task.Delay(responseDelayMs, ct);
                    firstPublish = false;
                }
                await PublishChunkAsync(db, envelope, pending, displayModel, seq - 1, isLast: false, ctx, ct);
                fullResponse.Append(pending).Append(' ');
            }

            pending = sentence;
            seq++;
        }

        if (pending is not null)
        {
            if (firstPublish && responseDelayMs > 0)
                await Task.Delay(responseDelayMs, ct);
            await PublishChunkAsync(db, envelope, pending, displayModel, seq - 1, isLast: true, ctx, ct);
            fullResponse.Append(pending);
        }
        else
        {
            _logger.LogWarning(
                "LlmStreamWorker: LLM produced empty response. Provider={Provider} Correlation={Correlation}",
                providerId, envelope.CorrelationId);
            return;
        }

        _logger.LogInformation(
            "LLM stream complete. Channel={Channel} Provider={Provider} Chunks={Chunks} Correlation={Correlation}",
            envelope.Message.ChannelName, providerId, seq, envelope.CorrelationId);

        // State update: fire-and-forget, best-effort.
        var botReply     = fullResponse.ToString().TrimEnd();
        var userMessage  = envelope.Message.Text;
        var channelId    = envelope.Message.ChannelId;

        _ = _history.AppendAsync(channelId, userMessage, botReply, MaxHistoryTurns)
            .ContinueWith(
                t => _logger.LogWarning(t.Exception, "History append failed. Correlation={Correlation}", envelope.CorrelationId),
                TaskContinuationOptions.OnlyOnFaulted);

        if (ctx?.CharacterId is { } characterId && characterId != Guid.Empty)
        {
            _ = _memoryIngestion.EnqueueAsync(new SynapseMemoryIngestionRequest(
                CharacterId: characterId,
                ChannelId:   channelId,
                Platform:    envelope.Message.PlatformId,
                UserMessage: userMessage,
                BotResponse: botReply,
                SenderName:  envelope.Message.Sender.UserName,
                Timestamp:   envelope.Message.Timestamp))
                .AsTask()
                .ContinueWith(
                    t => _logger.LogWarning(t.Exception, "Memory ingestion enqueue failed. Correlation={Correlation}", envelope.CorrelationId),
                    TaskContinuationOptions.OnlyOnFaulted);
        }
    }

    /// <summary>
    /// Resolves an <see cref="IChatCompletionService"/> for the given provider.
    /// Tries BYOK first (user-supplied API key); returns null to signal fallback to the platform Kernel.
    /// </summary>
    private async Task<IChatCompletionService?> ResolveChatServiceAsync(
        string providerId,
        string? modelId,
        Guid userId,
        string? cardBaseUrl,
        bool requiresApiKey,
        CancellationToken ct)
    {
        if (userId == Guid.Empty) return null;

        using var scope = _scopeFactory.CreateScope();
        var credPort    = scope.ServiceProvider.GetRequiredService<ILlmCredentialPort>();
        var cred        = await credPort.GetDecryptedAsync(userId, providerId, ct);

        if (cred is null)
        {
            // Keyless providers (Ollama, LM Studio, etc.) don't store credentials in the DB.
            // If the card supplies a base URL, create the service directly with an empty key.
            if (!requiresApiKey && !string.IsNullOrEmpty(cardBaseUrl))
            {
                _logger.LogDebug(
                    "LlmStreamWorker: keyless provider '{Provider}' resolved via cardBaseUrl={Url}",
                    providerId, cardBaseUrl);
                return _factoryRegistry.CreateService(providerId, modelId ?? string.Empty, string.Empty, cardBaseUrl);
            }
            return null;
        }

        // Card-level base_url wins over the global BYOK credential base URL.
        var effectiveBaseUrl = cardBaseUrl ?? cred.BaseUrl;
        _logger.LogDebug(
            "LlmStreamWorker BYOK resolved. Provider={Provider} LlmBaseUrl={LlmBaseUrl} CredBaseUrl={CredBaseUrl} Effective={Effective}",
            providerId, cardBaseUrl, cred.BaseUrl, effectiveBaseUrl);

        return _factoryRegistry.CreateService(providerId, modelId ?? string.Empty, cred.ApiKey, effectiveBaseUrl);
    }


    private async Task PublishChunkAsync(
        IDatabase db,
        SynapseAggregatedEnvelope envelope,
        string text,
        string model,
        int seq,
        bool isLast,
        ContextShardPayload? ctx,
        CancellationToken ct)
    {
        var emotionId        = envelope.Emotion?.CurrentEmotion;
        var emotionIntensity = envelope.Emotion?.Intensity ?? 0f;

        // VAD-based TTS prosody - continuous formula replaces static lookup table
        var vad              = EmotionVadTable.Map(emotionId);
        var ttsSpeedModifier  = Math.Clamp(1.0f + vad.A * 0.28f, 0.75f, 1.35f);
        var ttsEnergyModifier = Math.Clamp(1.0f + (vad.A * 0.5f + vad.V * 0.2f) * 0.25f, 0.80f, 1.30f);

        var physical = envelope.Physical;

        var payload = JsonSerializer.Serialize(new
        {
            correlationId  = envelope.CorrelationId,
            channelId      = envelope.Message.ChannelId,
            platformId     = envelope.Message.PlatformId,
            text,
            model,
            sequenceNumber = seq,
            isLast,
            userId                = ctx?.UserId,
            voiceId               = ctx?.TtsVoiceId,
            ttsProviderId         = ctx?.TtsProviderId,
            ttsModelId            = ctx?.TtsModelId,
            ttsSpeed              = ctx?.TtsSpeed ?? 1.0f,
            ttsBaseUrl            = ctx?.TtsBaseUrl,
            ttsProviderParamsJson = ctx?.TtsProviderParamsJson,
            emotionId,
            emotionIntensity,
            ttsSpeedModifier,
            ttsEnergyModifier,
            // SoulState - drives all frontend animation controllers
            vadV = vad.V,
            vadA = vad.A,
            vadD = vad.D,
            energy    = physical?.Energy    ?? 1.0f,
            attention = physical?.Attention ?? 0.0f,
            comfort   = physical?.Comfort   ?? 0.5f,
        }, SynapseConstants.Json.Write);

        await db.StreamAddAsync(
            _settings.StreamOut,
            [new NameValueEntry(_settings.PayloadFieldName, payload)],
            maxLength: (int)_settings.ApproximateMaxLength,
            useApproximateMaxLength: true);

        if (seq == 0)
            _logger.LogInformation(
                "First chunk → TTS pipeline started. Channel={Channel} Correlation={Correlation} Text={Text}",
                envelope.Message.ChannelName,
                envelope.CorrelationId,
                text.Length > 60 ? text[..60] + "…" : text);
        else
            _logger.LogDebug(
                "Chunk published. Seq={Seq} IsLast={IsLast} Chars={Chars} Correlation={Correlation}",
                seq, isLast, text.Length, envelope.CorrelationId);
    }


    private async Task HandleFailedEntryAsync(IDatabase db, StreamEntry entry, Exception ex)
    {
        var pending = await db.StreamPendingMessagesAsync(
            _settings.StreamIn, _settings.ConsumerGroup,
            count: 1, consumerName: RedisValue.Null, minId: entry.Id, maxId: entry.Id);

        var deliveries = pending.Length > 0 ? (int)pending[0].DeliveryCount : 1;
        if (deliveries < _settings.MaxPoisonMessageDeliveries) return;

        _logger.LogCritical(
            "LlmStreamWorker: poison message after {Deliveries} deliveries — moving to DLQ and ACKing. Id={Id}",
            deliveries, entry.Id);

        if (!string.IsNullOrEmpty(_settings.DeadLetterStreamName))
        {
            try
            {
                await db.StreamAddAsync(
                    _settings.DeadLetterStreamName,
                    [
                        new NameValueEntry("originalId",  entry.Id.ToString()),
                        new NameValueEntry("failedAtUtc", DateTimeOffset.UtcNow.ToString("O")),
                        new NameValueEntry("deliveries",  deliveries.ToString()),
                        new NameValueEntry("error",       ex.Message),
                        new NameValueEntry("payload",     ReadField(entry, _settings.PayloadFieldName) ?? string.Empty),
                    ],
                    maxLength: 10_000,
                    useApproximateMaxLength: true);
            }
            catch (Exception dlqEx)
            {
                _logger.LogCritical(dlqEx,
                    "LlmStreamWorker: failed to write to DLQ — ACKing anyway to unblock pipeline. Id={Id}",
                    entry.Id);
            }
        }

        await AckAsync(db, entry.Id);
    }
}
