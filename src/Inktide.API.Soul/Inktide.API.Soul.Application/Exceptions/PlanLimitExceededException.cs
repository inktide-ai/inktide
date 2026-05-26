namespace Inktide.API.Soul.Application.Exceptions;

/// <summary>
/// Thrown when a user attempts to create a resource that would exceed the limit of their plan.
/// Maps to HTTP 402 Payment Required.
/// </summary>
public sealed class PlanLimitExceededException : Exception
{
    public string LimitType { get; }
    public int Limit { get; }

    public PlanLimitExceededException(string limitType, int limit)
        : base($"Plan limit reached: {limitType} (max {limit}).")
    {
        LimitType = limitType;
        Limit     = limit;
    }
}
