namespace Chimera.API.Core.DependencyInjection;

/// <summary>
/// Rewrites Keycloak backchannel requests from the public origin to an internal one.
/// Used when the public issuer URL (e.g. http://localhost:8080) is unreachable from inside
/// a Docker container, but an internal URL (e.g. http://keycloak:8080) is available.
/// This ensures the JWT middleware can fetch OIDC metadata and JWKS even when the
/// discovery document's jwks_uri points to the public host.
/// </summary>
internal sealed class KeycloakUrlRewriteHandler(string publicOrigin, string internalOrigin)
    : DelegatingHandler(new HttpClientHandler())
{
    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        if (request.RequestUri is not null)
        {
            var url = request.RequestUri.ToString();
            if (url.StartsWith(publicOrigin, StringComparison.OrdinalIgnoreCase))
            {
                request.RequestUri = new Uri(
                    url.Replace(publicOrigin, internalOrigin, StringComparison.OrdinalIgnoreCase));
            }
        }
        return base.SendAsync(request, cancellationToken);
    }
}
