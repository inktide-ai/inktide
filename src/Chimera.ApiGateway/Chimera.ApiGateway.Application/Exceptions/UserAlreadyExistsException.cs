namespace Chimera.ApiGateway.Application.Exceptions;

/// <summary>Thrown when trying to register an email that is already taken.</summary>
public sealed class UserAlreadyExistsException : InvalidOperationException
{
    #region Fields

    private readonly string _email;

    #endregion

    #region Properties

    public string Email
    {
        get => _email;
    }

    #endregion

    #region Constructors

    public UserAlreadyExistsException(string email)
        : base($"User with email '{email}' already exists.")
    {
        _email = email;
    }

    #endregion
}
