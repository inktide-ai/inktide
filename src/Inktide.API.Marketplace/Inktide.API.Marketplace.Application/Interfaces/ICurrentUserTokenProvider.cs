namespace Inktide.API.Marketplace.Application.Interfaces;

public interface ICurrentUserTokenProvider
{
    string? GetBearerToken();
}
