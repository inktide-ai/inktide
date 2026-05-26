using Inktide.API.Graph.Domain;
using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;

namespace Inktide.API.Graph.Infrastructure.Handlers;

/// <summary>
/// Passes the initial input envelope straight through as the "out" port.
/// The executor already seeds the Input node with initialInput; this handler
/// re-emits it so downstream nodes see a normalised "out" key.
/// </summary>
public sealed class InputNodeHandler : INodeHandler
{
    public string Type => NodeTypes.Input;
    public string ProviderId => "core";

    public Task ExecuteAsync(NodeExecutionContext context, CancellationToken ct)
    {
        context.PassThrough();
        return Task.CompletedTask;
    }
}
