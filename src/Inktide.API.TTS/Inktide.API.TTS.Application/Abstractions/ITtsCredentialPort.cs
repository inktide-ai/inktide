namespace Inktide.API.TTS.Application.Abstractions;

/// <summary>
/// ACL port: per-user TTS provider credential lookup (implemented in Infrastructure via Soul's credential store).
/// Mirrors <c>ILlmCredentialPort</c> in Synapse.Application.
/// </summary>
public interface ITtsCredentialPort
{
    /// <summary>
    /// Returns the decrypted credential for <paramref name="userId"/> + <paramref name="providerId"/>,
    /// or null when no credential has been saved.
    /// </summary>
    Task<TtsResolvedCredential?> GetDecryptedAsync(Guid userId, string providerId, CancellationToken ct = default);
}

/// <summary>Decrypted TTS provider credential returned by <see cref="ITtsCredentialPort"/>.</summary>
public sealed record TtsResolvedCredential(string ApiKey, string? BaseUrl);
