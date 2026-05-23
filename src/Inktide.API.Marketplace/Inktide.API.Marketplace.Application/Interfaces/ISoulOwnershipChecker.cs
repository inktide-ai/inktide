namespace Inktide.API.Marketplace.Application.Interfaces;

public interface ISoulOwnershipChecker
{
    /// <summary>Returns true if the soul exists and belongs to the given user.</summary>
    Task<bool> OwnsSoulAsync(Guid userId, Guid soulId, CancellationToken ct);
}
