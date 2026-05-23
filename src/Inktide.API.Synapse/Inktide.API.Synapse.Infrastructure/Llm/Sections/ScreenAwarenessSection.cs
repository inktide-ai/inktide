using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Constants;

namespace Inktide.API.Synapse.Infrastructure.Llm.Sections;

internal sealed class ScreenAwarenessSection : IPromptSection
{
    public string? Build(SynapseAggregatedEnvelope envelope)
    {
        var screen = envelope.Screen;
        if (screen is not { RecentEvents.Count: > 0 }) return null;

        var cutoff = DateTimeOffset.UtcNow - SynapseConstants.Prompts.ScreenContextWindow;
        var fresh = screen.RecentEvents
            .Where(e => e.DetectedAt >= cutoff)
            .OrderByDescending(e => e.DetectedAt)
            .Take(SynapseConstants.Prompts.MaxFreshScreenEvents)
            .ToList();

        if (fresh.Count == 0) return null;

        var lines = fresh.Select(e =>
        {
            var age  = (int)(DateTimeOffset.UtcNow - e.DetectedAt).TotalSeconds;
            var meta = e.Metadata.Count > 0
                ? " (" + string.Join(", ", e.Metadata.Select(kv => $"{kv.Key}={kv.Value}")) + ")"
                : string.Empty;
            return $"- {e.EventType}{meta} [{age}s ago, confidence {e.Confidence:P0}]";
        });

        return
            "SCREEN CONTEXT (what is happening in the game right now):\n" +
            string.Join("\n", lines) + "\n" +
            "React naturally to these events if relevant. Do not list them mechanically.";
    }
}
