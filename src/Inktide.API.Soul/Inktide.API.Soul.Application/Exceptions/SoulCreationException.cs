namespace Inktide.API.Soul.Application.Exceptions;

/// <summary>
/// Thrown by SoulCreationGuard when a create request fails a pre-write business rule.
/// Maps to HTTP 400 with a structured error body.
/// </summary>
public sealed class SoulCreationException : Exception
{
    public string ErrorCode { get; }
    public string? Field { get; }

    public SoulCreationException(string errorCode, string message, string? field = null)
        : base(message)
    {
        ErrorCode = errorCode;
        Field     = field;
    }
}
