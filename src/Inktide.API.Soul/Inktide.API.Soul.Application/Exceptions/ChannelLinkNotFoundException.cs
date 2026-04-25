namespace Inktide.API.Soul.Application.Exceptions;

public sealed class ChannelLinkNotFoundException : Exception
{
    public ChannelLinkNotFoundException()
        : base("Channel link not found.")
    {
    }
}
