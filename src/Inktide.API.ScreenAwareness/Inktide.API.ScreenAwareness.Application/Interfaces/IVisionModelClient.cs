using Inktide.API.ScreenAwareness.Application.Models;

namespace Inktide.API.ScreenAwareness.Application.Interfaces;

/// <summary>
/// Pluggable vision model provider. Implementations: <c>AnthropicVisionClient</c>, <c>OllamaVisionClient</c>.
/// </summary>
public interface IVisionModelClient
{
    string ProviderId { get; }
    Task<ScreenAnalysis> AnalyzeAsync(string frameBase64, string contentType, CancellationToken ct = default);
}
