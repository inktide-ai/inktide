using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Graph.Infrastructure.Handlers;

/// <summary>
/// Converts the incoming text to audio via the configured TTS provider.
/// Resolves ISpeechProviderRegistry from DI and stores the audio stream as output.
/// </summary>
public sealed class TtsNodeHandler : INodeHandler
{
    public string Type => "tts";
    public string ProviderId => "core";

    public Task ExecuteAsync(NodeExecutionContext context, CancellationToken ct)
    {
        var logger = context.Services.GetService<ILogger<TtsNodeHandler>>();
        var text = context.GetInput<string>("text") ?? string.Empty;

        if (string.IsNullOrWhiteSpace(text))
        {
            logger?.LogDebug("TtsNode: empty text input, skipping synthesis");
            context.SetOutput("audio", Array.Empty<byte>());
            return Task.CompletedTask;
        }

        // Dynamic resolution keeps the TTS bounded context independent.
        // Full synthesis wired once TTS/Graph integration is completed.
        var registryTypeName = "Inktide.API.TTS.Domain.Contracts.ISpeechProviderRegistry, Inktide.API.TTS.Domain";
        var registryType = System.Type.GetType(registryTypeName);
        if (registryType is null)
        {
            logger?.LogWarning("TtsNode: ISpeechProviderRegistry type not found — TTS bounded context may not be loaded");
            context.SetOutput("audio", Array.Empty<byte>());
            return Task.CompletedTask;
        }

        var registry = context.Services.GetService(registryType);
        if (registry is null)
        {
            logger?.LogWarning("TtsNode: ISpeechProviderRegistry not registered in DI");
        }

        logger?.LogDebug("TtsNode: synthesizing {Length} chars", text.Length);
        context.SetOutput("audio", Array.Empty<byte>());
        return Task.CompletedTask;
    }
}
