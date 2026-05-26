using Inktide.API.Marketplace.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace Inktide.API.Marketplace.Infrastructure.Services;

internal sealed class HttpContextTokenProvider(IHttpContextAccessor httpContextAccessor)
    : ICurrentUserTokenProvider
{
    public string? GetBearerToken()
    {
        var header = httpContextAccessor.HttpContext?.Request.Headers.Authorization.ToString();
        return header?.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) == true
            ? header["Bearer ".Length..]
            : null;
    }
}
