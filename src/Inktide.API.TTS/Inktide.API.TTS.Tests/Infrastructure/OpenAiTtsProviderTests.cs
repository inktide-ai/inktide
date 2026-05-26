using Inktide.API.TTS.Infrastructure.OpenAi;
using Microsoft.Extensions.Options;

namespace Inktide.API.TTS.Tests.Infrastructure;

public sealed class OpenAiTtsProviderTests
{

    [Fact]
    public void Capabilities_SupportsModelListing_IsTrue()
    {
        var provider = new OpenAiTtsProvider(
            new OpenAiTtsClient(),
            Options.Create(new OpenAiTtsSettings()));

        Assert.True(provider.Capabilities.SupportsModelListing);
    }

}
