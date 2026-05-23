using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;

namespace Inktide.API.Graph.Domain.Providers;

/// <summary>
/// Terminal node — delivers the synthesised audio to the configured platform channel.
/// Mirror of the input connector; channel_target selects the outbound adapter.
/// </summary>
public sealed class OutputNodeProvider : INodeProvider
{
    public string Type => "output";
    public string ProviderId => "core";

    public NodeDefinition GetDefinition() => new(
        Type: Type,
        ProviderId: ProviderId,
        Label: "Output",
        Description: "Delivers audio to the target platform channel.",
        Inputs:
        [
            new Port("audio", "audio", "Rendered audio to deliver"),
        ],
        Outputs: [],
        ConfigSchema: new Dictionary<string, ConfigFieldSchema>
        {
            ["channel_target"] = new("select",
                Default: "discord",
                Description: "Outbound platform adapter",
                Options: ["discord", "twitch", "browser"]),

            ["fallback_text"] = new("bool",
                Default: true,
                Description: "Send raw text if audio delivery fails"),
        });
}
