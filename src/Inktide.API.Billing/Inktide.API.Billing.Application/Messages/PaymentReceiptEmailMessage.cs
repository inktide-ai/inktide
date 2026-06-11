namespace Inktide.API.Billing.Application.Messages;

public sealed record PaymentReceiptEmailMessage(
    string UserEmail,
    string PlanName,
    string Provider,
    DateTime PeriodEnd);
