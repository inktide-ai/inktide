using Inktide.API.Developer.Domain.Entities;
using Inktide.API.Developer.Domain.Repositories;
using Inktide.API.Developer.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Developer.Infrastructure.Repositories;

internal sealed class EfWebhookDeliveryRepository(DeveloperDbContext db) : IWebhookDeliveryRepository
{
    public async Task<WebhookDelivery?> FindByIdAsync(Guid id, CancellationToken ct) =>
        await db.WebhookDeliveries.FindAsync([id], ct);

    public async Task<IReadOnlyList<WebhookDelivery>> GetByApplicationAsync(
        Guid applicationId, int page, int pageSize, CancellationToken ct) =>
        await db.WebhookDeliveries
            .Where(d => d.ApplicationId == applicationId)
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

    public async Task AddAsync(WebhookDelivery delivery, CancellationToken ct)
    {
        db.WebhookDeliveries.Add(delivery);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(WebhookDelivery delivery, CancellationToken ct)
    {
        db.WebhookDeliveries.Update(delivery);
        await db.SaveChangesAsync(ct);
    }
}
