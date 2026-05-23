using System.Text.Json;
using Inktide.API.ScreenAwareness.Application.Interfaces;
using Inktide.API.ScreenAwareness.Application.Models;
using Microsoft.Extensions.Logging;

namespace Inktide.API.ScreenAwareness.Infrastructure.Vision;

/// <summary>
/// Parses JSON output from the vision model.
/// Expects: {"events":[{"event_type":"...","confidence":0.9,"metadata":{}}]}
/// Falls back to empty analysis on any parse failure.
/// </summary>
public sealed class JsonScreenEventExtractor : IScreenEventExtractor
{

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly ILogger<JsonScreenEventExtractor> _logger;

    public JsonScreenEventExtractor(ILogger<JsonScreenEventExtractor> logger)
    {
        _logger = logger;
    }

    public ScreenAnalysis Extract(string rawModelOutput)
    {
        if (string.IsNullOrWhiteSpace(rawModelOutput))
            return new ScreenAnalysis([]);

        try
        {
            // Find first { ... } block in the output — vision models sometimes prefix with prose.
            var start = rawModelOutput.IndexOf('{');
            var end   = rawModelOutput.LastIndexOf('}');
            if (start < 0 || end < 0 || end <= start)
                return new ScreenAnalysis([]);

            var json = rawModelOutput[start..(end + 1)];
            var raw  = JsonSerializer.Deserialize<RawAnalysis>(json, JsonOpts);
            if (raw?.Events is null)
                return new ScreenAnalysis([]);

            var events = raw.Events
                .Where(e => !string.IsNullOrWhiteSpace(e.EventType) && e.Confidence >= 0.3f)
                .Select(e => new DetectedScreenEvent(
                    e.EventType!.ToLowerInvariant().Replace(' ', '_'),
                    e.Confidence,
                    e.Metadata ?? new Dictionary<string, string>()))
                .ToList();

            return new ScreenAnalysis(events);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "[ScreenEventExtractor] Failed to parse vision output");
            return new ScreenAnalysis([]);
        }
    }

    private sealed class RawAnalysis
    {
        public List<RawEvent>? Events { get; set; }
    }

    private sealed class RawEvent
    {
        public string? EventType { get; set; }
        public float Confidence { get; set; }
        public Dictionary<string, string>? Metadata { get; set; }
    }

}
