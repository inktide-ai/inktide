using Inktide.API.TTS.Domain.Models;
using Google.Cloud.TextToSpeech.V1;

namespace Inktide.API.TTS.Infrastructure.GoogleCloud;

/// <summary>
/// Wraps the Google Cloud <see cref="TextToSpeechClient"/> (gRPC).
/// Caches one client per API key for config-sourced keys (stable, single key per deployment).
/// BYOK (per-request header keys) bypass the cache to prevent unbounded growth.
/// Key rotation requires a process restart when the config-key path is used.
/// </summary>
public sealed class GoogleCloudTtsClient
{

    // Race: two threads may both call CreateTransient() before the first stores;
    // at most one extra gRPC channel is created and discarded — acceptable at startup.
    private TextToSpeechClient? _cachedClient;


    /// <summary>
    /// Synthesises speech and returns the audio bytes as a <see cref="MemoryStream"/>.
    /// Google Cloud TTS returns a complete response (not chunked), so streaming is emulated.
    /// </summary>
    public async Task<Stream> SynthesizeAsync(
        string apiKey,
        SynthesizeSpeechRequest request,
        bool cacheClient,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);
        ArgumentNullException.ThrowIfNull(request);

        var client   = cacheClient ? GetOrCreateCached(apiKey) : CreateTransient(apiKey);
        var response = await client.SynthesizeSpeechAsync(request, ct).ConfigureAwait(false);

        var bytes = response.AudioContent.ToByteArray();
        return new MemoryStream(bytes, writable: false);
    }

    /// <summary>
    /// Returns all available voices via <c>ListVoices</c>.
    /// </summary>
    public async Task<SpeechVoiceCollection> GetVoicesAsync(
        string apiKey,
        bool cacheClient,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);

        var client   = cacheClient ? GetOrCreateCached(apiKey) : CreateTransient(apiKey);
        var response = await client
            .ListVoicesAsync(new ListVoicesRequest(), ct)
            .ConfigureAwait(false);

        return MapVoices(response);
    }


    private TextToSpeechClient GetOrCreateCached(string apiKey)
    {
        var existing = Volatile.Read(ref _cachedClient);
        if (existing is not null) return existing;
        var created = CreateTransient(apiKey);
        return Interlocked.CompareExchange(ref _cachedClient, created, null) ?? created;
    }

    private static TextToSpeechClient CreateTransient(string apiKey) =>
        new TextToSpeechClientBuilder { ApiKey = apiKey }.Build();

    private static SpeechVoiceCollection MapVoices(ListVoicesResponse response)
    {
        var result = new List<SpeechVoice>(response.Voices.Count);

        foreach (var v in response.Voices)
        {
            var locale = v.LanguageCodes.Count > 0 ? v.LanguageCodes[0] : null;
            var gender = v.SsmlGender.ToString(); // MALE, FEMALE, NEUTRAL

            IReadOnlyDictionary<string, string>? labels =
                new Dictionary<string, string> { ["gender"] = gender };

            result.Add(new SpeechVoice(v.Name, v.Name, locale, labels));
        }

        return new SpeechVoiceCollection(result);
    }

}
