namespace Inktide.API.Profile.Application.Interfaces;

public interface IEmailVerificationStore
{
    Task StoreAsync(string userId, string code, string newEmail, CancellationToken ct = default);

    /// <summary>
    /// Returns the pending new email if <paramref name="code"/> matches, then deletes the entry.
    /// Returns null on mismatch or expiry.
    /// </summary>
    Task<string?> VerifyAndConsumeAsync(string userId, string code, CancellationToken ct = default);
}
