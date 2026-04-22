using System.Text;
using System.Text.Json;

namespace Chimera.API.TTS.Infrastructure.Kokoro;


internal sealed class SpeechServiceHttpError
{

    internal SpeechServiceHttpError(string? code, string? message, string? param, string? kind)
    {
        Code = code;
        Message = message;
        Param = param;
        Kind = kind;
    }


    public string? Code { get; }

    public string? Message { get; }

    public string? Param { get; }
    
    public string? Kind { get; }


    public string ToExceptionMessage(int httpStatus)
    {
        var messageBuilder = new StringBuilder();
        messageBuilder.Append("HTTP ").Append(httpStatus).Append(" (").Append(Kind).Append(": ").Append(Code).AppendLine(")");
        if (!string.IsNullOrEmpty(Param))
        {
            messageBuilder.Append("Parameter: ").AppendLine(Param);
        }

        messageBuilder.AppendLine();
        messageBuilder.Append(Message);
        return messageBuilder.ToString();
    }


    internal static SpeechServiceHttpError? TryCreateFromContent(string content)
    {
        try
        {
            using JsonDocument errorDocument = JsonDocument.Parse(content);
            SpeechServiceHttpErrorResponse? errorResponse = DeserializeSpeechServiceHttpErrorResponse(errorDocument.RootElement);
            return errorResponse?.Error;
        }
        catch (InvalidOperationException)
        {
            return null;
        }
        catch (JsonException)
        {
            return null;
        }
    }


    private static SpeechServiceHttpErrorResponse? DeserializeSpeechServiceHttpErrorResponse(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Null)
        {
            return null;
        }

        SpeechServiceHttpError? error = null;

        foreach (var prop in element.EnumerateObject())
        {
            if (prop.NameEquals("error"u8))
            {
                error = DeserializeSpeechServiceHttpError(prop.Value);
                continue;
            }
        }

        return new SpeechServiceHttpErrorResponse(error);
    }

    private static SpeechServiceHttpError? DeserializeSpeechServiceHttpError(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Null)
        {
            return null;
        }

        string? code = null;
        string? message = null;
        string? param = null;
        string? kind = null;

        foreach (var prop in element.EnumerateObject())
        {
            if (prop.NameEquals("code"u8))
            {
                if (prop.Value.ValueKind == JsonValueKind.Null)
                {
                    code = null;
                    continue;
                }

                code = prop.Value.GetString();
                continue;
            }

            if (prop.NameEquals("message"u8))
            {
                message = prop.Value.GetString();
                continue;
            }

            if (prop.NameEquals("param"u8))
            {
                if (prop.Value.ValueKind == JsonValueKind.Null)
                {
                    param = null;
                    continue;
                }

                param = prop.Value.GetString();
                continue;
            }

            if (prop.NameEquals("type"u8))
            {
                kind = prop.Value.GetString();
                continue;
            }
        }

        return new SpeechServiceHttpError(code, message, param, kind);
    }

}

internal sealed class SpeechServiceHttpErrorResponse
{

    internal SpeechServiceHttpErrorResponse(SpeechServiceHttpError? error)
    {
        Error = error;
    }


    internal SpeechServiceHttpError? Error { get; }

}
