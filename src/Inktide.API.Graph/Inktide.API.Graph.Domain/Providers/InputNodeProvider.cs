using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;

namespace Inktide.API.Graph.Domain.Providers;

/// <summary>
/// Receives messages from connected platform connectors (Discord, Telegram, …)
/// and emits a typed context envelope downstream.
/// </summary>
public sealed class InputNodeProvider : INodeProvider
{
    public string Type => "input";
    public string ProviderId => "core";

    public NodeDefinition GetDefinition() => new(
        Type: Type,
        ProviderId: ProviderId,
        Label: "Input",
        Description: "Receives messages from platform connectors and emits a context envelope.",
        Inputs: [],
        Outputs:
        [
            new Port("out", "context", "Chat message + channel metadata"),
        ],
        ConfigSchema: new Dictionary<string, ConfigFieldSchema>
        {
            ["channel_filter"] = new("string",
                Default: "all",
                Description: "Filter by channel name or 'all'"),

            ["language"] = new("string",
                Default: "any",
                Description: "Accept messages in this language only, or 'any'"),

            ["max_message_length"] = new("number",
                Default: 2000,
                Description: "Drop messages longer than this (characters)"),
        });
}
