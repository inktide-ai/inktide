namespace Inktide.API.Billing.Application.Messages;

public sealed record YooKassaRenewalRequestedMessage(
    string UserId,
    string ProviderSubId,
    string Plan,
    DateTime PeriodEnd);
