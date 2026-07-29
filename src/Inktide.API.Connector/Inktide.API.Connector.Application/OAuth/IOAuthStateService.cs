namespace Inktide.API.Connector.Application.OAuth;

/// <summary>
/// Creates and verifies CSRF-protected state tokens for OAuth2 flows.
/// </summary>
public interface IOAuthStateService
{
    /// <summary>Creates a signed, expiring state token embedding userId and cardId.</summary>
    string CreateState(Guid userId, Guid cardId);

    /// <summary>
    /// Verifies the state token. Returns false for any invalid input - never throws on bad data.
    /// </summary>
    bool TryVerify(string state, out (Guid UserId, Guid CardId) ctx);
}
