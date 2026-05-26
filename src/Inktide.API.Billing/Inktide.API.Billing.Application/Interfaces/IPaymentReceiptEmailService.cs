namespace Inktide.API.Billing.Application.Interfaces;

public interface IPaymentReceiptEmailService
{
    Task SendReceiptAsync(string userEmail, string planName, string provider,
                          DateTime periodEnd, CancellationToken ct = default);
}
