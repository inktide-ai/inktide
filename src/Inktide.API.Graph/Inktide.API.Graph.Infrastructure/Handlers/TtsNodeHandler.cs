using Inktide.API.Core.Contracts;
using Inktide.API.Graph.Domain;
using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Graph.Infrastructure.Handlers;

/// <summary>
/// Converts the incoming text to audio via the configured TTS provider.
/// Resolves ITtsProviderLocator from the shared kernel — no compile-time dependency on TTS Domain.
/// </summary>
public sealed class TtsNodeHandler : INodeHandler
{
    public string Type => NodeTypes.Tts;
    public string ProviderId => "core";

    public Task ExecuteAsync(NodeExecutionContext context, CancellationToken ct)
    {
        var logger = context.Services.GetLogger<TtsNodeHandler>();
        var text   = context.GetInput<string>("text") ?? string.Empty;

        if (string.IsNullOrWhiteSpace(text))
        {
            logger.LogDebug("TtsNode: empty text input, skipping synthesis");
            context.SetOutput("audio", Array.Empty<byte>());
            return Task.CompletedTask;
        }

        var locator = context.Services.GetOptional<ITtsProviderLocator>();
        if (locator is null)
        {
            logger.LogWarning("TtsNode: ITtsProviderLocator not registered — TTS bounded context may not be loaded");
            context.SetOutput("audio", Array.Empty<byte>());
            return Task.CompletedTask;
        }

        // TODO(open): locator is resolved but synthesis is not yet called.
        // Full wiring (call locator.SynthesizeAsync and set real audio bytes) is
        // tracked as a follow-up once TTS/Graph integration milestone is scheduled.
        // For now the output is always empty bytes — P0 closed (no more Type.GetType),
        // but TTS in Graph remains non-functional until that milestone.
        logger.LogDebug("TtsNode: ITtsProviderLocator found — synthesis stub, wiring pending");
        context.SetOutput("audio", Array.Empty<byte>());
        return Task.CompletedTask;
    }
}
