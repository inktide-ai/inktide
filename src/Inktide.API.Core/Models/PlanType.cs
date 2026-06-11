namespace Inktide.API.Core.Models;

/// <summary>
/// Subscription plan tier. Cross-context: used by Billing (definition) and ScreenAwareness (budget enforcement).
/// </summary>
public enum PlanType { Free, Starter, Pro }
