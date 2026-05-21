using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Application.Interfaces;

public interface ILlmCredentialPort
{
    Task<SynapseResolvedCredential?> GetDecryptedAsync(
        Guid userId,
        string providerId,
        CancellationToken ct = default);
}
