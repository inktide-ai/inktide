using Inktide.API.Graph.Application.Interfaces;
using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Graph.Infrastructure.Handlers;

public sealed class EmotionNodeHandler : INodeHandler
{
    public string Type => "plugin";
    public string ProviderId => "emotion";

    public async Task ExecuteAsync(NodeExecutionContext context, CancellationToken ct)
    {
        var logger      = context.Services.GetService<ILogger<EmotionNodeHandler>>();
        var text        = context.GetInput<string>("context") ?? context.GetInput<string>("text") ?? string.Empty;
        var personality = context.GetInput<string>("personality") ?? string.Empty;

        context.SetOutput("context", text);
        context.SetOutput("emotion", "neutral");

        // Optional plugin: if Synapse module is disabled, IEmotionClassifier is not registered.
        // Graceful degrade to "neutral" is intentional — not a configuration error.
        var classifier = context.Services.GetService<IEmotionClassifier>();
        if (classifier is null)
        {
            logger?.LogWarning("EmotionNode: IEmotionClassifier not registered — emotion analysis skipped");
            return;
        }

        if (string.IsNullOrWhiteSpace(text))
        {
            logger?.LogDebug("EmotionNode: empty text, skipping classification");
            return;
        }

        try
        {
            var result = await classifier.ClassifyAsync(text, personality, ct);
            if (result is not null && !string.IsNullOrWhiteSpace(result.Label))
            {
                context.SetOutput("emotion", result.Label);
                logger?.LogDebug("EmotionNode: classified as '{Emotion}' (confidence={Confidence:F2})", result.Label, result.Confidence);
            }
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "EmotionNode: classification failed, defaulting to neutral");
        }
    }
}
