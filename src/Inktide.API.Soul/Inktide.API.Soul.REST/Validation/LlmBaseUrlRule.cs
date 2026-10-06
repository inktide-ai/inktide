using Inktide.API.Core.Providers;

namespace Inktide.API.Soul.REST.Validation;

/// <summary>
/// Which <c>llm_config.base_url</c> a card may point the server at. Hosted providers must use
/// HTTPS; local providers (Ollama, LM Studio, ...) may use plain HTTP because that is how they
/// are served. Link-local hosts are refused for every provider: 169.254.169.254 is the cloud
/// metadata service, which hands out the VM's credentials.
/// </summary>
internal static class LlmBaseUrlRule
{
    public const string Message =
        "llm_config.base_url must be an HTTPS URL (plain HTTP is allowed for local providers such as Ollama).";

    public static bool IsAllowed(string? providerId, string? url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
            return false;

        if (uri.HostNameType == UriHostNameType.IPv4 && uri.Host.StartsWith("169.254.", StringComparison.Ordinal))
            return false;

        return uri.Scheme == Uri.UriSchemeHttps
            || (uri.Scheme == Uri.UriSchemeHttp && LocalLlmProviders.Contains(providerId));
    }
}
