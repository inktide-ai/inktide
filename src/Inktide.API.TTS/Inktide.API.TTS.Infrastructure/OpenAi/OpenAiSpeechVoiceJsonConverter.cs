using System.Text.Json;
using System.Text.Json.Serialization;
using Inktide.API.Domain.Enums;

namespace Inktide.API.TTS.Infrastructure.OpenAi;

/// <summary>
/// Serializes <see cref="OpenAiSpeechVoice"/> as a JSON string (OpenAI Audio API <c>voice</c> field).
/// </summary>
public sealed class OpenAiSpeechVoiceJsonConverter : JsonConverter<OpenAiSpeechVoice>
{

    public override OpenAiSpeechVoice Read(
        ref Utf8JsonReader reader,
        Type typeToConvert,
        JsonSerializerOptions options)
    {
        var s = reader.GetString();
        if (string.IsNullOrWhiteSpace(s))
        {
            throw new JsonException("voice must be a non-empty string.");
        }

        return new OpenAiSpeechVoice(s);
    }

    public override void Write(Utf8JsonWriter writer, OpenAiSpeechVoice value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString());
    }

}
