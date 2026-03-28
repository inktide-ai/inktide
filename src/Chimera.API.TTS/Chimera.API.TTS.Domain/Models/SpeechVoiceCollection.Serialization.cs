using System.Text.Json;

namespace Chimera.API.TTS.Domain.Models;

public partial class SpeechVoiceCollection
{
    #region Internal Methods

    /// <summary>
    /// Parses <c>/v1/audio/voices</c> JSON payload (root object with <c>voices</c> array, or a bare array of strings).
    /// </summary>
    internal static SpeechVoiceCollection FromResponse(JsonElement root)
    {
        if (root.ValueKind == JsonValueKind.Null)
        {
            return null;
        }

        JsonElement array;
        if (root.ValueKind == JsonValueKind.Array)
        {
            array = root;
        }
        else if (root.ValueKind == JsonValueKind.Object &&
                 root.TryGetProperty("voices", out var voices))
        {
            array = voices;
        }
        else
        {
            return new SpeechVoiceCollection(new List<string>());
        }

        if (array.ValueKind != JsonValueKind.Array)
        {
            return new SpeechVoiceCollection(new List<string>());
        }

        var list = new List<string>();
        foreach (var el in array.EnumerateArray())
        {
            if (el.ValueKind != JsonValueKind.String)
            {
                continue;
            }

            var id = el.GetString();
            if (string.IsNullOrWhiteSpace(id))
            {
                continue;
            }

            list.Add(id);
        }

        return new SpeechVoiceCollection(list);
    }

    #endregion
}
