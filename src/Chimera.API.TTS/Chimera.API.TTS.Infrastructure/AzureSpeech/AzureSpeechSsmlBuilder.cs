using System.Security;
using System.Text;

namespace Chimera.API.TTS.Infrastructure.AzureSpeech;

/// <summary>
/// Builds SSML payloads for the Azure Cognitive Services Speech synthesis endpoint.
/// </summary>
internal static class AzureSpeechSsmlBuilder
{
    /// <summary>
    /// Builds an SSML document for the given parameters.
    /// </summary>
    /// <param name="voiceName">Azure voice short name, e.g. <c>en-US-JennyNeural</c>.</param>
    /// <param name="text">Plain text to synthesize. Will be XML-escaped.</param>
    /// <param name="rate">
    /// Speech rate as a signed percentage string, e.g. <c>"+20%"</c> or <c>"-10%"</c>.
    /// Pass <c>"0%"</c> for normal speed.
    /// </param>
    /// <param name="pitch">
    /// Pitch adjustment as a signed percentage string, e.g. <c>"+10%"</c>.
    /// Pass <c>"0%"</c> for default pitch.
    /// </param>
    /// <param name="volume">
    /// Volume adjustment as a signed percentage string, e.g. <c>"-20%"</c>.
    /// Pass <c>"0%"</c> for default volume.
    /// </param>
    /// <returns>UTF-8 SSML string ready to be posted to the TTS endpoint.</returns>
    internal static string Build(
        string voiceName,
        string text,
        string rate,
        string pitch,
        string volume)
    {
        var escapedText = SecurityElement.Escape(text) ?? string.Empty;

        // Derive xml:lang from the voice name (e.g. "en-US-JennyNeural" → "en-US").
        var lang = DeriveLocale(voiceName);

        return new StringBuilder(256)
            .Append("<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='")
            .Append(lang)
            .Append("'>")
            .Append("<voice name='")
            .Append(voiceName)
            .Append("'>")
            .Append("<prosody rate='")
            .Append(rate)
            .Append("' pitch='")
            .Append(pitch)
            .Append("' volume='")
            .Append(volume)
            .Append("'>")
            .Append(escapedText)
            .Append("</prosody>")
            .Append("</voice>")
            .Append("</speak>")
            .ToString();
    }

    /// <summary>
    /// Converts a signed float percentage (e.g. 20.0 or -10.0) to an Azure prosody string ("+20%" / "-10%").
    /// </summary>
    internal static string FormatProsodyPercent(float value)
    {
        // Azure expects explicit sign on positive values.
        return value >= 0
            ? $"+{value:0}%"
            : $"{value:0}%";
    }

    /// <summary>
    /// Converts a speed multiplier (1.0 = normal) to a signed rate percentage for Azure SSML.
    /// E.g. 1.5 → "+50%", 0.8 → "-20%".
    /// </summary>
    internal static string FormatRate(float speed)
    {
        var percent = (speed - 1.0f) * 100f;
        return FormatProsodyPercent(percent);
    }

    // ── Private ────────────────────────────────────────────────────────────────

    private static string DeriveLocale(string voiceName)
    {
        // Voice names follow the pattern "{locale}-{name}Neural", e.g. "en-US-JennyNeural".
        // Extract up to the second dash segment.
        var parts = voiceName.Split('-');
        if (parts.Length >= 2)
            return $"{parts[0]}-{parts[1]}";

        return "en-US"; // safe fallback
    }
}
