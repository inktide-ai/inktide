namespace Inktide.API.Organization.Application.Exceptions;

public sealed class InviteAlreadyAcceptedException : Exception
{
    public InviteAlreadyAcceptedException() : base("Invite has already been accepted.") { }
}
