namespace Inktide.API.Core.Contracts;

public sealed record PlanLimits(int MaxSoulCards, int MaxChannelsPerCard)
{
    public static readonly PlanLimits Free    = new(1, 1);
    public static readonly PlanLimits Starter = new(3, 2);
    public static readonly PlanLimits Pro     = new(int.MaxValue, int.MaxValue);
}

public interface IUserPlanResolver
{
    Task<PlanLimits> GetLimitsAsync(string userId, CancellationToken ct = default);
}
