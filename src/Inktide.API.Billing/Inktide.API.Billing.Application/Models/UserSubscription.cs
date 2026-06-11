using Inktide.API.Core.Generators;
using Inktide.API.Billing.Application.Models;
using Inktide.API.Core.Models;

namespace Inktide.API.Billing.Application.Models;

public sealed class UserSubscription
{
    public Guid Id { get; set; } = IdGenerator.New();
    public string UserId { get; set; } = string.Empty;
    public PlanType Plan { get; set; } = PlanType.Free;
    public SubStatus Status { get; set; } = SubStatus.Active;
    public string Provider { get; set; } = string.Empty;
    public string? ProviderSubId { get; set; }
    public string? ProviderCustomerId { get; set; }
    public DateTime? CurrentPeriodEnd { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public bool IsProActive(DateTime utcNow) =>
        Plan == PlanType.Pro &&
        (Status == SubStatus.Active || Status == SubStatus.Trialing) &&
        (CurrentPeriodEnd == null || CurrentPeriodEnd > utcNow);
}
