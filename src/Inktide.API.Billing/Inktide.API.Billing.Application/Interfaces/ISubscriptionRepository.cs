using Inktide.API.Billing.Application.Models;

namespace Inktide.API.Billing.Application.Interfaces;

public interface ISubscriptionRepository
{
    Task<UserSubscription?> GetByUserIdAsync(string userId, CancellationToken ct = default);
    Task<UserSubscription?> GetByProviderSubIdAsync(string providerSubId, CancellationToken ct = default);
    Task UpsertAsync(UserSubscription subscription, CancellationToken ct = default);
    Task DeleteByUserIdAsync(string userId, CancellationToken ct = default);
    Task<bool> TryExpireAsync(string userId, CancellationToken ct = default);
}
