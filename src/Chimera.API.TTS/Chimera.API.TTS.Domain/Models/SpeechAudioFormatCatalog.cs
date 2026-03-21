using System.Collections.ObjectModel;
using System.Diagnostics.CodeAnalysis;

namespace Chimera.API.TTS.Domain.Models;

/// <summary>
/// Registry of allowed output formats for <see cref="SpeechOptions"/> / REST (extensible, provider may still reject unsupported codecs).
/// </summary>
public static class SpeechAudioFormatCatalog
{
    #region Fields

    private static readonly IReadOnlyDictionary<string, SpeechAudioFormatInfo> _byId;

    private static readonly IReadOnlyList<SpeechAudioFormatInfo> _all;

    public const string DefaultFormatId = "mp3";

    #endregion

    #region Constructors

    static SpeechAudioFormatCatalog()
    {
        var list = new List<SpeechAudioFormatInfo>
        {
            new()
            {
                Id = "mp3",
                MimeType = "audio/mpeg",
                FileExtension = "mp3",
                Description = "MPEG-1 Audio Layer III, widely supported.",
            },
            new()
            {
                Id = "wav",
                MimeType = "audio/wav",
                FileExtension = "wav",
                Description = "WAV (PCM), lossless container.",
            },
            new()
            {
                Id = "flac",
                MimeType = "audio/flac",
                FileExtension = "flac",
                Description = "FLAC lossless compression.",
            },
            new()
            {
                Id = "ogg",
                MimeType = "audio/ogg",
                FileExtension = "ogg",
                Description = "Ogg container (codec depends on upstream).",
            },
            new()
            {
                Id = "opus",
                MimeType = "audio/opus",
                FileExtension = "opus",
                Description = "Opus codec (low latency).",
            },
            new()
            {
                Id = "webm",
                MimeType = "audio/webm",
                FileExtension = "webm",
                Description = "WebM audio (often Opus inside).",
            },
            new()
            {
                Id = "pcm",
                MimeType = "audio/pcm",
                FileExtension = "pcm",
                Description = "Raw PCM (layout depends on provider).",
            },
            new()
            {
                Id = "aac",
                MimeType = "audio/aac",
                FileExtension = "aac",
                Description = "Advanced Audio Coding.",
            },
        };

        var byId = new Dictionary<string, SpeechAudioFormatInfo>(StringComparer.OrdinalIgnoreCase);
        foreach (var item in list)
        {
            byId[item.Id] = item;
        }

        // Common aliases (Yandex / SpeechKit–style naming)
        byId["mpeg"] = byId["mp3"];
        byId["mpga"] = byId["mp3"];
        byId["wave"] = byId["wav"];

        _byId = new ReadOnlyDictionary<string, SpeechAudioFormatInfo>(byId);
        _all = new ReadOnlyCollection<SpeechAudioFormatInfo>(list);
    }

    #endregion

    #region Properties

    /// <summary>
    /// Stable list for <c>GET /api/tts/audio-formats</c> documentation.
    /// </summary>
    public static IReadOnlyList<SpeechAudioFormatInfo> All => _all;

    #endregion

    #region Public Methods

    /// <summary>
    /// Resolves user input to a known format; falls back to <see cref="DefaultFormatId"/> when null or whitespace.
    /// </summary>
    public static SpeechAudioFormatInfo Resolve(string? requestedFormatId)
    {
        if (TryResolve(requestedFormatId, out var info, out _))
        {
            return info;
        }

        throw new FormatException(
            $"Unknown audio_format '{requestedFormatId}'. See GET .../audio-formats for supported values.");
    }

    /// <summary>
    /// Returns <c>true</c> if <paramref name="formatId"/> is registered (after alias resolution).
    /// </summary>
    public static bool IsKnownFormat(string? formatId)
    {
        if (string.IsNullOrWhiteSpace(formatId))
        {
            return true;
        }

        return _byId.ContainsKey(formatId.Trim());
    }

    /// <summary>
    /// Resolves format; empty input selects <see cref="DefaultFormatId"/>.
    /// </summary>
    public static bool TryResolve(
        string? requestedFormatId,
        [NotNullWhen(true)] out SpeechAudioFormatInfo? info,
        out string? errorMessage)
    {
        if (string.IsNullOrWhiteSpace(requestedFormatId))
        {
            info = _byId[DefaultFormatId];
            errorMessage = null;
            return true;
        }

        if (_byId.TryGetValue(requestedFormatId.Trim(), out var found))
        {
            info = found;
            errorMessage = null;
            return true;
        }

        info = null;
        errorMessage = $"Unknown audio_format '{requestedFormatId}'. Use GET .../audio-formats for supported values.";
        return false;
    }

    #endregion
}
