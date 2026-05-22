using Inktide.API.Graph.Application.Models;

namespace Inktide.API.Graph.Application.Interfaces;

public interface IEmotionClassifier
{
    Task<EmotionClassification?> ClassifyAsync(
        string message,
        string? personality,
        CancellationToken ct,
        float intensityScale = 1.0f);
}
