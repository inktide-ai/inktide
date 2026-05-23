using Inktide.API.ScreenAwareness.Application.Models;

namespace Inktide.API.ScreenAwareness.Application.Interfaces;

/// <summary>Parses the raw text output from a vision model into a structured <see cref="ScreenAnalysis"/>.</summary>
public interface IScreenEventExtractor
{
    ScreenAnalysis Extract(string rawModelOutput);
}
