using Inktide.API.TTS.Domain.Speech;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Inktide.API.TTS.Infrastructure.Decorators;

internal sealed class SpeechProviderDecoratorApplicator(ILoggerFactory loggerFactory, IMemoryCache cache)
{
    internal ISpeechProvider Apply(ISpeechProvider raw)
    {
        ISpeechProvider chain = new LoggingSpeechProviderDecorator(
            raw,
            loggerFactory.CreateLogger($"SpeechProvider.{raw.Id}"));

        return new CachingSpeechProviderDecorator(
            chain,
            cache,
            loggerFactory.CreateLogger<CachingSpeechProviderDecorator>());
    }
}
