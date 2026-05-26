using FluentValidation.Results;
using Inktide.API.Domain.Models;
using Inktide.API.TTS.Application.Abstractions;
using Inktide.API.TTS.Application.Configuration;
using Inktide.API.TTS.Application.Synthesis;
using Inktide.API.TTS.Domain.Exceptions;
using Inktide.API.TTS.Domain.Models;
using Inktide.API.TTS.Domain.Speech;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace Inktide.API.TTS.Tests.Application;

public sealed class TtsSynthesisServiceTests
{

    private const string ProviderId = "test-provider";
    private const string DefaultProviderId = "default-provider";

    private readonly ISpeechProviderRegistry _registry;
    private readonly IApiKeyResolver _keyResolver;
    private readonly ITtsUsageRecorder _usageRecorder;
    private readonly IOptions<TtsProviderOptions> _options;


    public TtsSynthesisServiceTests()
    {
        _registry    = Substitute.For<ISpeechProviderRegistry>();
        _keyResolver = Substitute.For<IApiKeyResolver>();
        _usageRecorder = Substitute.For<ITtsUsageRecorder>();
        _options = Options.Create(new TtsProviderOptions { DefaultProviderId = DefaultProviderId });
    }


    private TtsSynthesisService CreateService() =>
        new(_registry, _options, _keyResolver, _usageRecorder, NullLogger<TtsSynthesisService>.Instance);


    private ISpeechProvider BuildProvider(string id, bool requiresApiKey = false, bool supportsStreaming = true)
    {
        var provider = Substitute.For<ISpeechProvider>();
        provider.Id.Returns(id);
        provider.Name.Returns(id);
        provider.Capabilities.Returns(new SpeechProviderCapabilities
        {
            RequiresApiKey   = requiresApiKey,
            SupportsStreaming = supportsStreaming,
        });
        provider.Validate(Arg.Any<ProviderOptions>()).Returns(new ValidationResult());
        return provider;
    }


    private SynthesizeCommand Command(string? providerId = ProviderId, bool stream = false) =>
        new(ProviderId:  providerId,
            Text:        "Hello world",
            VoiceId:     "voice-1",
            ModelId:     null,
            Speed:       null,
            Stream:      stream,
            AudioFormat: "wav");


    [Fact]
    public async Task SynthesizeAsync_ProviderNotFound_ReturnsProviderNotFound()
    {
        _registry.TryGet(ProviderId, out _).Returns(false);

        var result = await CreateService().SynthesizeAsync(Command());

        var notFound = Assert.IsType<SpeechResult.ProviderNotFound>(result);
        Assert.Equal(ProviderId, notFound.ProviderId);
    }

    [Fact]
    public async Task SynthesizeAsync_ApiKeyMissing_ReturnsApiKeyMissing()
    {
        var provider = BuildProvider(ProviderId, requiresApiKey: true);
        _registry.TryGet(ProviderId, out Arg.Any<ISpeechProvider?>()!)
            .Returns(x => { x[1] = provider; return true; });

        _keyResolver.Resolve(ProviderId).Throws(new ApiKeyMissingException("missing"));

        var result = await CreateService().SynthesizeAsync(Command());

        var missing = Assert.IsType<SpeechResult.ApiKeyMissing>(result);
        Assert.Equal(ProviderId, missing.ProviderId);
    }

    [Fact]
    public async Task SynthesizeAsync_ValidationFailed_ReturnsValidationFailed()
    {
        var provider = BuildProvider(ProviderId);
        provider.Validate(Arg.Any<ProviderOptions>()).Returns(
            new ValidationResult([new ValidationFailure("Voice", "Voice required")]));
        _registry.TryGet(ProviderId, out Arg.Any<ISpeechProvider?>()!)
            .Returns(x => { x[1] = provider; return true; });
        _keyResolver.Resolve(ProviderId).Returns((string?)null);

        var result = await CreateService().SynthesizeAsync(Command());

        Assert.IsType<SpeechResult.ValidationFailed>(result);
    }

    [Fact]
    public async Task SynthesizeAsync_StreamingNotSupported_ReturnsStreamingNotSupported()
    {
        var provider = BuildProvider(ProviderId, supportsStreaming: false);
        _registry.TryGet(ProviderId, out Arg.Any<ISpeechProvider?>()!)
            .Returns(x => { x[1] = provider; return true; });
        _keyResolver.Resolve(ProviderId).Returns((string?)null);

        var result = await CreateService().SynthesizeAsync(Command(stream: true));

        var notSupported = Assert.IsType<SpeechResult.StreamingNotSupported>(result);
        Assert.Equal(ProviderId, notSupported.ProviderId);
    }

    [Fact]
    public async Task SynthesizeAsync_UpstreamHttpError_ReturnsUpstreamError()
    {
        var provider = BuildProvider(ProviderId);
        _registry.TryGet(ProviderId, out Arg.Any<ISpeechProvider?>()!)
            .Returns(x => { x[1] = provider; return true; });
        _keyResolver.Resolve(ProviderId).Returns((string?)null);
        provider.SynthesizeAsync(Arg.Any<ProviderOptions>(), Arg.Any<SpeechOptions>(), Arg.Any<CancellationToken>())
            .Throws(new HttpRequestException("upstream down"));

        var result = await CreateService().SynthesizeAsync(Command());

        Assert.IsType<SpeechResult.UpstreamError>(result);
    }

    [Fact]
    public async Task SynthesizeAsync_Success_ReturnsOk()
    {
        var provider = BuildProvider(ProviderId);
        _registry.TryGet(ProviderId, out Arg.Any<ISpeechProvider?>()!)
            .Returns(x => { x[1] = provider; return true; });
        _keyResolver.Resolve(ProviderId).Returns((string?)null);

        using var audioStream = new MemoryStream([0x52, 0x49, 0x46, 0x46]);
        provider.SynthesizeAsync(Arg.Any<ProviderOptions>(), Arg.Any<SpeechOptions>(), Arg.Any<CancellationToken>())
            .Returns(audioStream);

        var result = await CreateService().SynthesizeAsync(Command());

        var ok = Assert.IsType<SpeechResult.Ok>(result);
        Assert.Equal("audio/wav", ok.ContentType);
    }

    [Fact]
    public async Task SynthesizeAsync_UsesDefaultProvider_WhenProviderIdIsNull()
    {
        var provider = BuildProvider(DefaultProviderId);
        _registry.TryGet(DefaultProviderId, out Arg.Any<ISpeechProvider?>()!)
            .Returns(x => { x[1] = provider; return true; });
        _keyResolver.Resolve(DefaultProviderId).Returns((string?)null);

        using var audioStream = new MemoryStream([0x52]);
        provider.SynthesizeAsync(Arg.Any<ProviderOptions>(), Arg.Any<SpeechOptions>(), Arg.Any<CancellationToken>())
            .Returns(audioStream);

        var result = await CreateService().SynthesizeAsync(Command(providerId: null));

        Assert.IsType<SpeechResult.Ok>(result);
    }

}
