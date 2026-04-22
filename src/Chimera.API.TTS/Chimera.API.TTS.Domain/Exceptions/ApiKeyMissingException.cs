namespace Chimera.API.TTS.Domain.Exceptions;

/// <summary>
/// Thrown when a TTS provider requires an API key but none was supplied (header or configuration).
/// </summary>
public sealed class ApiKeyMissingException : Exception
{

    public ApiKeyMissingException()
    {
    }

    public ApiKeyMissingException(string message)
        : base(message)
    {
    }

    public ApiKeyMissingException(string message, Exception innerException)
        : base(message, innerException)
    {
    }

}
