namespace Inktide.API.Marketplace.Application.Interfaces;

public interface ISoulOwnershipChecker
{
    /// <summary>Returns true if the soul exists and is owned by the caller (identity resolved from the forwarded Bearer token).</summary>
    Task<bool> OwnsSoulAsync(Guid soulId, CancellationToken ct);
}
