namespace Inktide.API.Organization.Application.Exceptions;

public sealed class InviteExpiredException : Exception
{
    public InviteExpiredException() : base("Invite has expired.") { }
}
