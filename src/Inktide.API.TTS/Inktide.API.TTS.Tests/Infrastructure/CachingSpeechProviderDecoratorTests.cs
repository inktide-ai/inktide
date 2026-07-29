using FluentValidation.Results;
using Inktide.API.Domain.Models;
using Inktide.API.TTS.Domain.Models;
using Inktide.API.TTS.Domain.Speech;
using Inktide.API.TTS.Infrastructure.Decorators;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace Inktide.API.TTS.Tests.Infrastructure;

public sealed class CachingSpeechProviderDecoratorTests
{

    private static (CachingSpeechProviderDecorator decorator, IVoiceListingProvider innerVl) BuildVoiceDecorator()
    {
        var inner = Substitute.For<ISpeechProvider, IVoiceListingProvider>();
        inner.Id.Returns("test");
        inner.Name.Returns("test");
        inner.Capabilities.Returns(new SpeechProviderCapabilities { SupportsVoiceListing = true });
        inner.Validate(Arg.Any<ProviderOptions>()).Returns(new ValidationResult());
        ((IVoiceListingProvider)inner)
            .GetVoicesAsync(Arg.Any<ProviderOptions>(), Arg.Any<string?>(), Arg.Any<CancellationToken>())
            .Returns(new SpeechVoiceCollection([]));

        var cache = new MemoryCache(new MemoryCacheOptions());
        var decorator = new CachingSpeechProviderDecorator(
            inner, cache, NullLogger<CachingSpeechProviderDecorator>.Instance);

        return (decorator, (IVoiceListingProvider)inner);
    }

    [Fact]
    public async Task GetVoicesAsync_ByokKey_DoesNotServeCachedResultFromOtherKey()
    {
        var (decorator, innerVl) = BuildVoiceDecorator();
        var options = new ProviderOptions { ApiKeyIsTransient = true };

        await decorator.GetVoicesAsync(options, "model-1");
        await decorator.GetVoicesAsync(options, "model-1");

        // Inner provider must be called on every BYOK request - never cached.
        await innerVl.Received(2)
            .GetVoicesAsync(Arg.Any<ProviderOptions>(), "model-1", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetVoicesAsync_SharedKey_CachesResultOnSecondCall()
    {
        var (decorator, innerVl) = BuildVoiceDecorator();
        var options = new ProviderOptions { ApiKeyIsTransient = false };

        await decorator.GetVoicesAsync(options, "model-1");
        await decorator.GetVoicesAsync(options, "model-1");

        // Inner provider must be called exactly once - second call served from cache.
        await innerVl.Received(1)
            .GetVoicesAsync(Arg.Any<ProviderOptions>(), "model-1", Arg.Any<CancellationToken>());
    }

}
