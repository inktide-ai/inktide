using System.Text.Json;
using System.Text.Json.Serialization;
using Chimera.API.Domain.Enums;

namespace Chimera.API.TTS.Infrastructure.Kokoro;

/// <summary>
/// Serializes <see cref="KokoroSpeechVoice"/> as a JSON string (Kokoro API <c>voice</c> field).
/// </summary>
public sealed class KokoroSpeechVoiceJsonConverter : JsonConverter<KokoroSpeechVoice>
{
    #region Public Methods

    public override KokoroSpeechVoice Read(
        ref Utf8JsonReader reader,
        Type typeToConvert,
        JsonSerializerOptions options)
    {
        var s = reader.GetString();
        if (string.IsNullOrWhiteSpace(s))
        {
            throw new JsonException("voice must be a non-empty string.");
        }

        return new KokoroSpeechVoice(s);
    }

    public override void Write(Utf8JsonWriter writer, KokoroSpeechVoice value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString());
    }

    #endregion
}
