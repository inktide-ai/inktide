using Inktide.API.Graph.Domain;
using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;

namespace Inktide.API.Graph.Infrastructure.Handlers;

/// <summary>
/// Plugin: applies configurable text filtering rules to the input before passing it downstream.
/// </summary>
public sealed class FilterNodeHandler : INodeHandler
{
    public string Type => NodeTypes.Plugin;
    public string ProviderId => "filter";

    public Task ExecuteAsync(NodeExecutionContext context, CancellationToken ct)
    {
        var text      = context.GetInput<string>("text") ?? context.GetInput<string>("context") ?? string.Empty;
        var maxLength = context.GetConfig<int?>("max_length") ?? int.MaxValue;

        if (text.Length > maxLength)
            text = text[..maxLength];

        context.SetOutput("text", text);
        return Task.CompletedTask;
    }
}
