namespace Inktide.API.Organization.Application.Exceptions;

public sealed class InviteNotFoundException : Exception
{
    public InviteNotFoundException() : base("Invite not found.") { }
}
