using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;

namespace Inktide.API.Graph.Domain.Providers;

public sealed class TwitchInputNodeProvider : INodeProvider
{
    public string Type => "input";
    public string ProviderId => "twitch";

    public NodeDefinition GetDefinition() => new(
        Type: Type,
        ProviderId: ProviderId,
        Label: "Twitch",
        Description: "Receives messages from a Twitch channel chat.",
        Inputs: [],
        Outputs:
        [
            new Port("out", "context", "Twitch chat message + viewer metadata"),
        ],
        ConfigSchema: new Dictionary<string, ConfigFieldSchema>
        {
            ["channel_name"] = new("string",
                Default: "",
                Description: "Twitch channel name (without #)"),

            ["bits_only"] = new("bool",
                Default: false,
                Description: "Process only bit cheer messages"),

            ["subs_only"] = new("bool",
                Default: false,
                Description: "Process only subscriber messages"),
        });
}
