namespace Inktide.API.Soul.Application.Exceptions;

public sealed class ChannelLinkConflictException : Exception
{
    public ChannelLinkConflictException(string message)
        : base(message)
    {
    }
}
