using System.ClientModel;
using System.Collections.Concurrent;
using Inktide.API.TTS.Domain.Models;
using OpenAI.Audio;

namespace Inktide.API.TTS.Infrastructure.OpenAi;

/// <summary>
/// Shared HTTP client for both <see cref="OpenAiTtsProvider"/> and <see cref="OpenAiCompatibleTtsProvider"/>.
/// Caches one <see cref="AudioClient"/> per (modelId, endpoint) pair for config-sourced API keys so the
/// underlying HTTP connection pool is reused — avoiding socket exhaustion under load.
/// BYOK (per-request header keys) bypass the cache to prevent unbounded growth.
/// Key rotation requires a process restart when the config-key path is used.
/// </summary>
public sealed class OpenAiTtsClient
{
    private readonly ConcurrentDictionary<(string ModelId, string Endpoint), AudioClient> _clients = new();

    public async Task<Stream> SynthesizeAsync(
        Uri endpoint,
        string apiKey,
        string modelId,
        SpeechOptions speechOptions,
        bool cacheClient,
        CancellationToken ct)
    {
        var client = cacheClient ? GetOrCreateCached(apiKey, modelId, endpoint) : CreateTransient(apiKey, modelId, endpoint);

        var options = new SpeechGenerationOptions
        {
            SpeedRatio = (float)Math.Clamp(
                speechOptions.Speed <= 0 ? 1.0 : speechOptions.Speed, 0.25, 4.0),
            ResponseFormat = MapFormat(speechOptions.AudioFormat),
        };

        var result = await client
            .GenerateSpeechAsync(
                speechOptions.Text,
                new GeneratedSpeechVoice(speechOptions.Voice),
                options,
                ct)
            .ConfigureAwait(false);

        return result.Value.ToStream();
    }

    private AudioClient GetOrCreateCached(string apiKey, string modelId, Uri endpoint)
    {
        var key = (ModelId: modelId, Endpoint: endpoint.ToString());
        return _clients.GetOrAdd(key, _ => CreateTransient(apiKey, modelId, endpoint));
    }

    private static AudioClient CreateTransient(string apiKey, string modelId, Uri endpoint) =>
        new AudioClient(
            model: modelId,
            credential: new ApiKeyCredential(apiKey),
            options: new OpenAI.OpenAIClientOptions { Endpoint = endpoint });

    private static GeneratedSpeechFormat MapFormat(string? audioFormat)
        => audioFormat?.ToLowerInvariant() switch
        {
            "mp3"  => GeneratedSpeechFormat.Mp3,
            "opus" => GeneratedSpeechFormat.Opus,
            "aac"  => GeneratedSpeechFormat.Aac,
            "flac" => GeneratedSpeechFormat.Flac,
            "pcm"  => GeneratedSpeechFormat.Pcm,
            "wav"  => GeneratedSpeechFormat.Wav,
            _      => GeneratedSpeechFormat.Mp3,
        };
}
