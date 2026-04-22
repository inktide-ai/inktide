using System.Security;
using System.Text;

namespace Chimera.API.TTS.Infrastructure.AzureSpeech;

/// <summary>
/// Builds SSML payloads for the Azure Cognitive Services Speech synthesis endpoint.
/// </summary>
internal static class AzureSpeechSsmlBuilder
{
    internal static string Build(
        string voiceName,
        string text,
        string rate,
        string pitch,
        string volume)
    {
        var escapedText = SecurityElement.Escape(text) ?? string.Empty;
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

    // Azure prosody strings require an explicit '+' sign on positive values.
    internal static string FormatProsodyPercent(float value)
    {
        return value >= 0
            ? $"+{value:0}%"
            : $"{value:0}%";
    }

    internal static string FormatRate(float speed)
    {
        var percent = (speed - 1.0f) * 100f;
        return FormatProsodyPercent(percent);
    }

    private static string DeriveLocale(string voiceName)
    {
        // Voice names: "{locale}-{name}Neural", e.g. "en-US-JennyNeural"
        var parts = voiceName.Split('-');
        if (parts.Length >= 2)
            return $"{parts[0]}-{parts[1]}";

        return "en-US"; // safe fallback
    }
}
