using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;

namespace Inktide.API.Graph.Domain.Providers;

public sealed class DiscordInputNodeProvider : INodeProvider
{
    public string Type => "input";
    public string ProviderId => "discord";

    public NodeDefinition GetDefinition() => new(
        Type: Type,
        ProviderId: ProviderId,
        Label: "Discord",
        Description: "Receives messages from a Discord guild channel.",
        Inputs: [],
        Outputs:
        [
            new Port("out", "context", "Discord message + channel metadata"),
        ],
        ConfigSchema: new Dictionary<string, ConfigFieldSchema>
        {
            ["guild_id"] = new("string",
                Default: "",
                Description: "Discord Guild (Server) ID"),

            ["channel_id"] = new("string",
                Default: "",
                Description: "Discord Channel ID to listen on"),

            ["language"] = new("string",
                Default: "any",
                Description: "Accept messages in this language only, or \"any\""),
        });
}
