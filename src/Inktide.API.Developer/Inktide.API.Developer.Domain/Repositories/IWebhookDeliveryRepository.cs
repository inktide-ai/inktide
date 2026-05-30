using Inktide.API.Developer.Domain.Entities;

namespace Inktide.API.Developer.Domain.Repositories;

public interface IWebhookDeliveryRepository
{
    Task<IReadOnlyList<WebhookDelivery>> GetByApplicationAsync(
        Guid applicationId, int page, int pageSize, CancellationToken ct);
    Task AddAsync(WebhookDelivery delivery, CancellationToken ct);
    Task UpdateAsync(WebhookDelivery delivery, CancellationToken ct);
}
