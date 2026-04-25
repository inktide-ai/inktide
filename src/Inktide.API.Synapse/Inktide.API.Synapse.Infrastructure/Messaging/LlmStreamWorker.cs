using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using Inktide.API.Memory.Domain.Models;
using Inktide.API.Memory.Domain.Ports;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Synapse.Application.Configuration;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Llm;
using Inktide.API.Synapse.Infrastructure.Providers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
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
public sealed class LlmStreamWorker : BackgroundService
{

    private static readonly JsonSerializerOptions JsonIn = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    private static readonly JsonSerializerOptions JsonOut = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly IConnectionMultiplexer _redis;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IMemoryIngestionService _memoryIngestion;
    private readonly IConversationHistoryRepository _history;
    private readonly Kernel _kernel;
    private readonly ChatServiceFactoryRegistry _factoryRegistry;
    private readonly LlmStreamSettings _settings;
    private readonly ILogger<LlmStreamWorker> _logger;
    private readonly string _consumerName;

    private const int MaxHistoryTurns = 20;

    private readonly SemaphoreSlim _llmSem = new(1, 1);


    public LlmStreamWorker(
        IConnectionMultiplexer redis,
        IServiceScopeFactory scopeFactory,
        IMemoryIngestionService memoryIngestion,
        IConversationHistoryRepository history,
        Kernel kernel,
        ChatServiceFactoryRegistry factoryRegistry,
        IOptions<LlmStreamSettings> settings,
        ILogger<LlmStreamWorker> logger)
    {
        _redis            = redis            ?? throw new ArgumentNullException(nameof(redis));
        _scopeFactory     = scopeFactory     ?? throw new ArgumentNullException(nameof(scopeFactory));
        _memoryIngestion  = memoryIngestion  ?? throw new ArgumentNullException(nameof(memoryIngestion));
        _history          = history          ?? throw new ArgumentNullException(nameof(history));
        _kernel           = kernel           ?? throw new ArgumentNullException(nameof(kernel));
        _factoryRegistry  = factoryRegistry  ?? throw new ArgumentNullException(nameof(factoryRegistry));
        _settings         = settings?.Value  ?? throw new ArgumentNullException(nameof(settings));
        _logger           = logger           ?? throw new ArgumentNullException(nameof(logger));

        var instanceId = Environment.GetEnvironmentVariable("DOTNET_HOSTNAME")
                         ?? Environment.GetEnvironmentVariable("HOSTNAME")
                         ?? Environment.GetEnvironmentVariable("K8S_POD_NAME")
                         ?? Guid.NewGuid().ToString("N")[..8];
        _consumerName = $"{_settings.ConsumerNamePrefix}-{instanceId}";
    }


    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            var db = _redis.GetDatabase();
            await EnsureConsumerGroupAsync(db, stoppingToken);

            _logger.LogInformation(
                "LlmStreamWorker started. StreamIn={StreamIn} Group={Group} Consumer={Consumer}",
                _settings.StreamIn, _settings.ConsumerGroup, _consumerName);

            await Task.WhenAll(
                ConsumeLoopAsync(db, stoppingToken),
                AutoClaimLoopAsync(db, stoppingToken));
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }

        _logger.LogInformation("LlmStreamWorker stopped.");
    }


    // -------------------------------------------------------------------------
    // Consumer group / Redis loop
    // -------------------------------------------------------------------------

    private async Task EnsureConsumerGroupAsync(IDatabase db, CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await db.StreamCreateConsumerGroupAsync(
                    _settings.StreamIn,
                    _settings.ConsumerGroup,
                    StreamPosition.Beginning,
                    createStream: true);
                return;
            }
            catch (RedisException ex) when (ex.Message.Contains("BUSYGROUP", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogDebug("Consumer group already exists: {Group}", _settings.ConsumerGroup);
                return;
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "LlmStreamWorker: failed to create consumer group, retrying in 2s...");
                await Task.Delay(TimeSpan.FromSeconds(2), ct);
            }
        }
    }

    private async Task ConsumeLoopAsync(IDatabase db, CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                var entries = await db.StreamReadGroupAsync(
                    _settings.StreamIn,
                    _settings.ConsumerGroup,
                    _consumerName,
                    position: null,
                    count: _settings.ReadCount,
                    noAck: false);

                if (entries.Length == 0)
                {
                    await Task.Delay(_settings.ReadBlockMilliseconds, ct);
                    continue;
                }

                foreach (var entry in entries)
                    await ProcessEntryAsync(db, entry, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "LlmStreamWorker: stream read error, retrying in 2s...");
                await Task.Delay(TimeSpan.FromSeconds(2), ct);
            }
        }
    }

    private async Task AutoClaimLoopAsync(IDatabase db, CancellationToken ct)
    {
        var cursor = (RedisValue)"0-0";

        while (!ct.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(_settings.AutoClaimLoopDelaySeconds), ct);
            try
            {
                var result = await db.StreamAutoClaimAsync(
                    _settings.StreamIn,
                    _settings.ConsumerGroup,
                    _consumerName,
                    minIdleTimeInMs: _settings.AutoClaimMinIdleMs,
                    startAtId: cursor,
                    count: _settings.AutoClaimBatchSize);

                if (result.IsNull) { cursor = "0-0"; continue; }

                cursor = result.NextStartId.IsNullOrEmpty || result.NextStartId == "0-0"
                    ? "0-0"
                    : result.NextStartId;

                foreach (var entry in result.ClaimedEntries)
                    await ProcessEntryAsync(db, entry, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "LlmStreamWorker: XAUTOCLAIM iteration failed");
                cursor = "0-0";
            }
        }
    }


    // -------------------------------------------------------------------------
    // Per-message processing
    // -------------------------------------------------------------------------

    private async Task ProcessEntryAsync(IDatabase db, StreamEntry entry, CancellationToken ct)
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
            envelope = JsonSerializer.Deserialize<SynapseAggregatedEnvelope>(payloadJson, JsonIn);
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
            // Do NOT ACK — XAUTOCLAIM will retry after AutoClaimMinIdleMs.
            _logger.LogError(ex,
                "LlmStreamWorker: unhandled error. Correlation={Correlation} — will retry via XAUTOCLAIM",
                envelope.CorrelationId);
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

        // Resolve chat completion service.
        // Priority: BYOK (user's own key) → platform provider registered in Kernel.
        IChatCompletionService? chatService = null;
        var userId = ctx?.UserId ?? Guid.Empty;

        if (userId != Guid.Empty)
        {
            using var scope = _scopeFactory.CreateScope();
            var credSvc     = scope.ServiceProvider.GetRequiredService<IUserProviderCredentialService>();
            var cred        = await credSvc.GetDecryptedAsync(userId, providerId, ct);

            if (cred is not null)
            {
                // Card-level base_url wins over the global BYOK credential base URL.
                var effectiveBaseUrl = ctx?.LlmBaseUrl ?? cred.BaseUrl;
                _logger.LogDebug(
                    "LlmStreamWorker BYOK resolved. Provider={Provider} LlmBaseUrl={LlmBaseUrl} CredBaseUrl={CredBaseUrl} Effective={Effective}",
                    providerId, ctx?.LlmBaseUrl, cred.BaseUrl, effectiveBaseUrl);
                chatService = _factoryRegistry.CreateService(
                    providerId, modelId ?? string.Empty, cred.ApiKey, effectiveBaseUrl);
            }
        }

        // No BYOK — fall back to the platform provider registered in the Kernel (e.g. Ollama).
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

        var history = SynapsePromptBuilder.Build(envelope);

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

        _ = _history.AppendAsync(channelId, userMessage, botReply, MaxHistoryTurns);

        if (ctx?.AiCardId is { } aiCardId && aiCardId != Guid.Empty)
        {
            _ = _memoryIngestion.EnqueueAsync(new MemoryIngestionJob(
                AiCardId:    aiCardId,
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
        var payload = JsonSerializer.Serialize(new
        {
            correlationId  = envelope.CorrelationId,
            channelId      = envelope.Message.ChannelId,
            platformId     = envelope.Message.PlatformId,
            text,
            model,
            sequenceNumber = seq,
            isLast,
            voiceId          = ctx?.TtsVoiceId,
            ttsProviderId    = ctx?.TtsProviderId,
            ttsModelId       = ctx?.TtsModelId,
            ttsSpeed         = ctx?.TtsSpeed ?? 1.0f,
            emotionId        = envelope.Emotion?.Emotion,
            emotionIntensity = envelope.Emotion?.Intensity ?? 0f,
        }, JsonOut);

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


    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Task AckAsync(IDatabase db, RedisValue id)
        => db.StreamAcknowledgeAsync(_settings.StreamIn, _settings.ConsumerGroup, id);

    private static string? ReadField(StreamEntry entry, string field)
    {
        foreach (var v in entry.Values)
            if (v.Name.ToString() == field) return v.Value.ToString();
        return null;
    }

}
