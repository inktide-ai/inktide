using System.Diagnostics.Metrics;

namespace Inktide.API.Billing.Infrastructure.Telemetry;

public sealed class BillingMetrics
{
    private readonly Meter _meter = new("Inktide.API.Billing", "1.0.0");

    public readonly Counter<long> SubscriptionsExpiredTotal;
    public readonly Histogram<double> RenewalDurationMs;
    public readonly Counter<long> WebhookMetadataMissingTotal;

    public BillingMetrics()
    {
        SubscriptionsExpiredTotal = _meter.CreateCounter<long>(
            "billing_subscriptions_expired_total",
            description: "Number of subscriptions expired by the expiry sweep job.");

        RenewalDurationMs = _meter.CreateHistogram<double>(
            "billing_renewal_duration_ms",
            description: "Duration of a YooKassa auto-renewal HTTP call in milliseconds.");

        WebhookMetadataMissingTotal = _meter.CreateCounter<long>(
            "billing_webhook_metadata_missing_total",
            description: "Webhooks with missing plan or user_id metadata that could not create a subscription record.");
    }
}
