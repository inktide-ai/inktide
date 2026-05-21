using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Infrastructure.Adapters;

public sealed class LlmCredentialAdapter : ILlmCredentialPort
{
    private readonly IUserProviderCredentialService _credentials;

    public LlmCredentialAdapter(IUserProviderCredentialService credentials)
    {
        _credentials = credentials ?? throw new ArgumentNullException(nameof(credentials));
    }

    public async Task<SynapseResolvedCredential?> GetDecryptedAsync(
        Guid userId,
        string providerId,
        CancellationToken ct = default)
    {
        var cred = await _credentials.GetDecryptedAsync(userId, providerId, ct);
        if (cred is null) return null;
        return new SynapseResolvedCredential(cred.ApiKey, cred.BaseUrl);
    }
}
