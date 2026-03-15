namespace Chimera.API.Identify.Application.Exceptions;

/// <summary>
/// Thrown when a database unique constraint is violated (e.g. duplicate email).
/// Infrastructure maps DbUpdateException to this.
/// </summary>
public sealed class UniqueConstraintViolationException : Exception
{
    #region Constructors

    public UniqueConstraintViolationException(string? message = null, Exception? innerException = null)
        : base(message ?? "A unique constraint was violated.", innerException)
    {
    }

    #endregion
}
