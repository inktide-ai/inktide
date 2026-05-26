using System.Collections.ObjectModel;
using System.Text.Json;

namespace Inktide.API.TTS.Domain.Models;

public sealed class SpeechVoiceCollection : ReadOnlyCollection<SpeechVoice>
{

    internal SpeechVoiceCollection(IList<SpeechVoice> items)
        : base(items ?? new List<SpeechVoice>())
    {
    }


    /// <summary>
    /// Parses an OpenAI-compatible <c>/v1/audio/voices</c> JSON payload
    /// (root object with <c>voices</c> array of strings, or a bare string array).
    /// Voice metadata is not available in this format; only <see cref="SpeechVoice.Id"/> is populated.
    /// </summary>
    internal static SpeechVoiceCollection FromResponse(JsonElement root)
    {
        if (root.ValueKind == JsonValueKind.Null)
        {
            return new SpeechVoiceCollection([]);
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
            return new SpeechVoiceCollection([]);
        }

        if (array.ValueKind != JsonValueKind.Array)
        {
            return new SpeechVoiceCollection([]);
        }

        var list = new List<SpeechVoice>();
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

            list.Add(new SpeechVoice(id));
        }

        return new SpeechVoiceCollection(list);
    }

}
