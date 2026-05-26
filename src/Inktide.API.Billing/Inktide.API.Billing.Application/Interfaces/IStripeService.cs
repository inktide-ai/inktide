namespace Inktide.API.Billing.Application.Interfaces;

public interface IStripeService
{
    Task<string> CreatePaymentIntentAsync(
        string userId,
        string userEmail,
        string plan,
        string period,
        CancellationToken ct = default);
}
