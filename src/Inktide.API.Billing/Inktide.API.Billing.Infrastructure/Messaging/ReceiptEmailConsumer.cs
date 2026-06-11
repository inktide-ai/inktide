using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Application.Messages;
using MassTransit;

namespace Inktide.API.Billing.Infrastructure.Messaging;

public sealed class ReceiptEmailConsumer : IConsumer<PaymentReceiptEmailMessage>
{
    private readonly IPaymentReceiptEmailService _emailService;

    public ReceiptEmailConsumer(IPaymentReceiptEmailService emailService)
    {
        _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
    }

    public Task Consume(ConsumeContext<PaymentReceiptEmailMessage> context)
    {
        var msg = context.Message;
        return _emailService.SendReceiptAsync(
            msg.UserEmail, msg.PlanName, msg.Provider, msg.PeriodEnd,
            context.CancellationToken);
    }
}
