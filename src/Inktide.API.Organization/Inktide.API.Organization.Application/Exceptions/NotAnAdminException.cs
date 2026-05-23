namespace Inktide.API.Organization.Application.Exceptions;

public sealed class NotAnAdminException : Exception
{
    public NotAnAdminException() : base("Only organization admins can perform this action.") { }
}
