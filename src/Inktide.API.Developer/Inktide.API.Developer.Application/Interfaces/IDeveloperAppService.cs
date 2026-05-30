using Inktide.API.Developer.Application.Models;

namespace Inktide.API.Developer.Application.Interfaces;

public interface IDeveloperAppService
{
    Task<ApplicationDto> CreateAsync(string ownerId, CreateApplicationCommand cmd, CancellationToken ct);
    Task<IReadOnlyList<ApplicationDto>> GetByOwnerAsync(string ownerId, CancellationToken ct);
    Task<ApplicationDto?> GetByIdAsync(Guid id, string ownerId, CancellationToken ct);
    Task<ApplicationDto> UpdateAsync(Guid id, string ownerId, UpdateApplicationCommand cmd, CancellationToken ct);
    Task DeleteAsync(Guid id, string ownerId, CancellationToken ct);
    Task<ApplicationDto> RotateSecretAsync(Guid id, string ownerId, CancellationToken ct);
    Task<AppInfoDto?> GetAppInfoAsync(string keycloakClientId, string? scopeString, string redirectUri, CancellationToken ct);
    Task<IReadOnlyList<WebhookDeliveryDto>> GetDeliveriesAsync(Guid appId, string ownerId, int page, int pageSize, CancellationToken ct);
}
