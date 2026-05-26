using FluentValidation.Results;
using Inktide.API.Domain.Models;
using Inktide.API.TTS.Domain.Models;
using Inktide.API.TTS.Domain.Speech;
using NSubstitute;

namespace Inktide.API.TTS.Tests.Domain;

public sealed class SpeechProviderRegistryTests
{

    private static ISpeechProvider BuildProvider(string id)
    {
        var p = Substitute.For<ISpeechProvider>();
        p.Id.Returns(id);
        p.Name.Returns(id);
        p.Capabilities.Returns(new SpeechProviderCapabilities());
        p.Validate(Arg.Any<ProviderOptions>()).Returns(new ValidationResult());
        return p;
    }


    [Fact]
    public void Constructor_DuplicateId_Throws()
    {
        var a = BuildProvider("kokoro");
        var b = BuildProvider("kokoro");

        Assert.Throws<InvalidOperationException>(() =>
            new SpeechProviderRegistry([a, b]));
    }

    [Fact]
    public void TryGet_ReturnsTrue_ForRegisteredProvider()
    {
        var p = BuildProvider("kokoro");
        var registry = new SpeechProviderRegistry([p]);

        Assert.True(registry.TryGet("kokoro", out var resolved));
        Assert.Same(p, resolved);
    }

    [Fact]
    public void TryGet_ReturnsFalse_ForUnknownProvider()
    {
        var registry = new SpeechProviderRegistry([BuildProvider("kokoro")]);

        Assert.False(registry.TryGet("elevenlabs", out _));
    }

    [Fact]
    public void GetRequired_Throws_ForUnknownProvider()
    {
        var registry = new SpeechProviderRegistry([BuildProvider("kokoro")]);

        Assert.Throws<KeyNotFoundException>(() => registry.GetRequired("elevenlabs"));
    }

    [Fact]
    public void Descriptors_ContainsAllRegisteredProviders()
    {
        var providers = new[] { BuildProvider("a"), BuildProvider("b"), BuildProvider("c") };
        var registry = new SpeechProviderRegistry(providers);

        Assert.Equal(3, registry.Descriptors.Count);
        Assert.All(providers, p => Assert.Contains(p.Id, registry.Descriptors));
    }

    [Fact]
    public void BuildDescriptor_CopiesAllCapabilityFields()
    {
        var caps = new SpeechProviderCapabilities
        {
            RequiresApiKey       = true,
            SupportsVoiceListing = true,
            SupportsStreaming     = true,
            SupportsModelListing  = true,
        };

        var p = Substitute.For<ISpeechProvider>();
        p.Id.Returns("test");
        p.Name.Returns("test");
        p.Capabilities.Returns(caps);
        p.Validate(Arg.Any<ProviderOptions>()).Returns(new ValidationResult());

        var registry = new SpeechProviderRegistry([p]);
        var descriptor = registry.Descriptors["test"];

        Assert.Equal(caps.RequiresApiKey,       descriptor.Capabilities.RequiresApiKey);
        Assert.Equal(caps.SupportsVoiceListing, descriptor.Capabilities.SupportsVoiceListing);
        Assert.Equal(caps.SupportsStreaming,     descriptor.Capabilities.SupportsStreaming);
        Assert.Equal(caps.SupportsModelListing,  descriptor.Capabilities.SupportsModelListing);
    }

}
