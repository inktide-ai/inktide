namespace Inktide.API.Core.Contracts;

/// <summary>
/// Shared kernel abstraction that allows the Graph context to invoke TTS
/// without a compile-time dependency on Inktide.API.TTS.Domain.
/// Implemented by an adapter in Inktide.API.TTS.Infrastructure once TTS/Graph wiring is complete.
/// </summary>
public interface ITtsProviderLocator
{
    Task<byte[]> SynthesizeAsync(string text, string voiceId, CancellationToken ct);
}
