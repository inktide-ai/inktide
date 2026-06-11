using Inktide.API.Core.Generators;

namespace Inktide.API.Billing.Application.Models;

public sealed class BillingIncident
{
    public Guid Id { get; set; } = IdGenerator.New();
    public string Provider { get; set; } = string.Empty;
    public string EventId { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string RawPayload { get; set; } = string.Empty;
    public DateTime OccurredAt { get; set; }
}
