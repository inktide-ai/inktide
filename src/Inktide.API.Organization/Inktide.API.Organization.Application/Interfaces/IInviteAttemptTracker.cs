namespace Inktide.API.Organization.Application.Interfaces;

public interface IInviteAttemptTracker
{
    /// Records an invalid-token attempt for the (actorId, token) pair.
    /// Returns false when the per-actor attempt limit is exceeded.
    Task<bool> TryRecordAttemptAsync(string token, string actorId, CancellationToken ct = default);
}
