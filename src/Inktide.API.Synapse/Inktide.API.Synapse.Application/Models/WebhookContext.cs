namespace Inktide.API.Synapse.Application.Models;

/// <summary>Result from a user-registered Webhook Shard. Injected into the prompt as additional context.</summary>
public sealed record WebhookContext(string Context);
