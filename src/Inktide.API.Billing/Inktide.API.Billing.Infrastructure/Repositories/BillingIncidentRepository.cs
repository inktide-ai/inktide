using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Application.Models;
using Inktide.API.Billing.Infrastructure.DbContext;

namespace Inktide.API.Billing.Infrastructure.Repositories;

public sealed class BillingIncidentRepository : IBillingIncidentRepository
{
    private readonly BillingDbContext _db;

    public BillingIncidentRepository(BillingDbContext db) =>
        _db = db ?? throw new ArgumentNullException(nameof(db));

    public async Task RecordAsync(BillingIncident incident, CancellationToken ct = default)
    {
        _db.BillingIncidents.Add(incident);
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
    }
}
