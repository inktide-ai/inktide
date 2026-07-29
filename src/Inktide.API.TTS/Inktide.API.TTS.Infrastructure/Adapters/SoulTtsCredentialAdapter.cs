using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.TTS.Application.Abstractions;

namespace Inktide.API.TTS.Infrastructure.Adapters;

/// <summary>
/// ACL adapter: resolves per-user TTS credentials from Soul's <see cref="IUserProviderCredentialService"/>.
/// Mirrors <c>LlmCredentialAdapter</c> in Synapse.Infrastructure - same Soul table, same encryption.
/// </summary>
internal sealed class SoulTtsCredentialAdapter : ITtsCredentialPort
{
    private readonly IUserProviderCredentialService _credentials;

    public SoulTtsCredentialAdapter(IUserProviderCredentialService credentials)
    {
        _credentials = credentials ?? throw new ArgumentNullException(nameof(credentials));
    }

    public async Task<TtsResolvedCredential?> GetDecryptedAsync(
        Guid userId, string providerId, CancellationToken ct = default)
    {
        var cred = await _credentials.GetDecryptedAsync(userId, providerId, ct);
        if (cred is null) return null;
        return new TtsResolvedCredential(cred.ApiKey, cred.BaseUrl);
    }
}
