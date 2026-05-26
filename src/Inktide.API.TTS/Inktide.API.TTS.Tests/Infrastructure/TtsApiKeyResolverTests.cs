using Inktide.API.TTS.Domain.Exceptions;
using Inktide.API.TTS.Domain.Models;
using Inktide.API.TTS.Domain.Speech;
using Inktide.API.TTS.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Primitives;
using NSubstitute;

namespace Inktide.API.TTS.Tests.Infrastructure;

public sealed class TtsApiKeyResolverTests
{

    private static ISpeechProvider BuildProvider(string id, bool requiresApiKey)
    {
        var p = Substitute.For<ISpeechProvider>();
        p.Id.Returns(id);
        p.Capabilities.Returns(new SpeechProviderCapabilities { RequiresApiKey = requiresApiKey });
        return p;
    }

    private static ISpeechProviderRegistry BuildRegistry(ISpeechProvider provider)
    {
        var reg = Substitute.For<ISpeechProviderRegistry>();
        reg.TryGet(provider.Id, out Arg.Any<ISpeechProvider?>()!)
            .Returns(x => { x[1] = provider; return true; });
        return reg;
    }

    private static IHttpContextAccessor BuildAccessor(string? headerValue = null)
    {
        var accessor = Substitute.For<IHttpContextAccessor>();
        if (headerValue is null)
        {
            accessor.HttpContext.Returns((HttpContext?)null);
            return accessor;
        }

        var context = Substitute.For<HttpContext>();
        var request = Substitute.For<HttpRequest>();
        var headers = Substitute.For<IHeaderDictionary>();
        headers[TtsApiKeyResolver.TtsApiKeyHeader].Returns(new StringValues(headerValue));
        request.Headers.Returns(headers);
        context.Request.Returns(request);
        accessor.HttpContext.Returns(context);
        return accessor;
    }

    private static IConfiguration BuildConfig(string? configKey = null, string? configValue = null)
    {
        var config = Substitute.For<IConfiguration>();
        if (configKey is not null)
            config[configKey].Returns(configValue);
        return config;
    }


    [Fact]
    public void Resolve_ProviderDoesNotRequireKey_ReturnsNull()
    {
        var provider = BuildProvider("kokoro", requiresApiKey: false);
        var registry = BuildRegistry(provider);
        var resolver = new TtsApiKeyResolver(registry, BuildAccessor(), BuildConfig());

        var result = resolver.Resolve("kokoro");

        Assert.Null(result);
    }

    [Fact]
    public void Resolve_KeyFromHeader_ReturnsHeaderKey()
    {
        var provider = BuildProvider("elevenlabs", requiresApiKey: true);
        var registry = BuildRegistry(provider);
        var resolver = new TtsApiKeyResolver(registry, BuildAccessor("header-key-123"), BuildConfig());

        var result = resolver.Resolve("elevenlabs");

        Assert.Equal("header-key-123", result);
    }

    [Fact]
    public void Resolve_KeyFromConfig_ReturnsConfigKey()
    {
        var provider = BuildProvider("elevenlabs", requiresApiKey: true);
        var registry = BuildRegistry(provider);
        var config = BuildConfig("TtsProviders:elevenlabs:ApiKey", "config-key-456");
        var resolver = new TtsApiKeyResolver(registry, BuildAccessor(), config);

        var result = resolver.Resolve("elevenlabs");

        Assert.Equal("config-key-456", result);
    }

    [Fact]
    public void Resolve_NoKeyAnywhere_ThrowsApiKeyMissingException()
    {
        var provider = BuildProvider("elevenlabs", requiresApiKey: true);
        var registry = BuildRegistry(provider);
        var resolver = new TtsApiKeyResolver(registry, BuildAccessor(), BuildConfig());

        Assert.Throws<ApiKeyMissingException>(() => resolver.Resolve("elevenlabs"));
    }

    [Fact]
    public void IsHeaderKey_WithHeader_ReturnsTrue()
    {
        var provider = BuildProvider("elevenlabs", requiresApiKey: true);
        var registry = BuildRegistry(provider);
        var resolver = new TtsApiKeyResolver(registry, BuildAccessor("some-key"), BuildConfig());

        Assert.True(resolver.IsHeaderKey("elevenlabs"));
    }

    [Fact]
    public void IsHeaderKey_WithoutHeader_ReturnsFalse()
    {
        var provider = BuildProvider("elevenlabs", requiresApiKey: true);
        var registry = BuildRegistry(provider);
        var resolver = new TtsApiKeyResolver(registry, BuildAccessor(), BuildConfig());

        Assert.False(resolver.IsHeaderKey("elevenlabs"));
    }

}
