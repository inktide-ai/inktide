using System.Collections.Concurrent;
using Chimera.API.TTS.Domain.Models;
using Google.Cloud.TextToSpeech.V1;

namespace Chimera.API.TTS.Infrastructure.GoogleCloud;

/// <summary>
/// Wraps the Google Cloud <see cref="TextToSpeechClient"/> (gRPC).
/// Clients are created once per unique API key and cached for reuse —
/// <see cref="TextToSpeechClient"/> is thread-safe and holds a gRPC channel.
/// </summary>
public sealed class GoogleCloudTtsClient
{
    #region Fields

    private readonly ConcurrentDictionary<string, TextToSpeechClient> _clients = new();

    #endregion

    #region Public Methods

    /// <summary>
    /// Synthesises speech and returns the audio bytes as a <see cref="MemoryStream"/>.
    /// Google Cloud TTS returns a complete response (not chunked), so streaming is emulated.
    /// </summary>
    public async Task<Stream> SynthesizeAsync(
        string apiKey,
        SynthesizeSpeechRequest request,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);
        ArgumentNullException.ThrowIfNull(request);

        var client   = GetOrCreate(apiKey);
        var response = await client.SynthesizeSpeechAsync(request, ct).ConfigureAwait(false);

        var bytes = response.AudioContent.ToByteArray();
        return new MemoryStream(bytes, writable: false);
    }

    /// <summary>
    /// Returns all available voices via <c>ListVoices</c>.
    /// </summary>
    public async Task<SpeechVoiceCollection> GetVoicesAsync(
        string apiKey,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);

        var client   = GetOrCreate(apiKey);
        var response = await client
            .ListVoicesAsync(new ListVoicesRequest(), ct)
            .ConfigureAwait(false);

        return MapVoices(response);
    }

    #endregion

    #region Private Methods

    private TextToSpeechClient GetOrCreate(string apiKey) =>
        _clients.GetOrAdd(apiKey, k => new TextToSpeechClientBuilder { ApiKey = k }.Build());

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

    #endregion
}
