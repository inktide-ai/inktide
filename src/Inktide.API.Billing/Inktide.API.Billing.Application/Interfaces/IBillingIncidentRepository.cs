using Inktide.API.Billing.Application.Models;

namespace Inktide.API.Billing.Application.Interfaces;

public interface IBillingIncidentRepository
{
    Task RecordAsync(BillingIncident incident, CancellationToken ct = default);
}
