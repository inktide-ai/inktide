using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;

namespace Inktide.API.Graph.Domain.Providers;

public sealed class TelegramInputNodeProvider : INodeProvider
{
    public string Type => "input";
    public string ProviderId => "telegram";

    public NodeDefinition GetDefinition() => new(
        Type: Type,
        ProviderId: ProviderId,
        Label: "Telegram",
        Description: "Receives messages from a Telegram bot chat or group.",
        Inputs: [],
        Outputs:
        [
            new Port("out", "context", "Telegram message + sender metadata"),
        ],
        ConfigSchema: new Dictionary<string, ConfigFieldSchema>
        {
            ["chat_id"] = new("string",
                Default: "",
                Description: "Telegram Chat ID (group, supergroup, or private)"),

            ["commands_only"] = new("bool",
                Default: false,
                Description: "Process only /command messages"),
        });
}
