using Inktide.API.Domain.Models;

namespace Inktide.API.Synapse.REST.Models;

public sealed class DemoChatRequest
{
    public string Text { get; set; } = string.Empty;
    public List<ChatMessage>? History { get; set; }
}

public sealed class DemoChatResponse
{
    public string Text { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
}
