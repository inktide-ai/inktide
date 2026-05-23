using Inktide.API.Core.Contracts;
using Inktide.API.Core.Generators;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Domain.Repositories;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Project.Infrastructure.Services;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using NSubstitute;
using Xunit;

namespace Inktide.API.Project.Tests.Import;

public sealed class InktFileImportServiceTests
{
    private static readonly Guid UserId = IdGenerator.New();

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static Stream MakeValidInkt(
        string projectName    = "My Project",
        bool   includeSoul    = false,
        bool   includeBrain   = false,
        int    formatVersion  = 1,
        string? llmModelId    = "gpt-4o",
        string? ttsVoiceId    = null,
        string[]? requiredFeatures = null)
    {
        var ms  = new MemoryStream();
        using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            AddEntry(zip, "metadata.json", new
            {
                formatVersion,
                projectVersion         = "1.0",
                minimumPlatformVersion = "1.0",
                exportedAt             = DateTimeOffset.UtcNow,
                requiredFeatures       = requiredFeatures ?? Array.Empty<string>(),
            });

            AddEntry(zip, "project.json", new
            {
                name        = projectName,
                description = (string?)null,
                status      = "active",
            });

            if (includeSoul)
            {
                AddEntry(zip, "soul.json", new
                {
                    localId      = "soul-main",
                    name         = "Aria",
                    slug         = "aria",
                    description  = "A test soul",
                    status       = "active",
                    personality  = "Friendly",
                    systemPrompt = "You are Aria.",
                    llmModelId,
                    llmProvider  = "openai",
                    llmConfig    = new { temperature = 0.7 },
                    ttsVoiceId,
                    ttsProvider  = ttsVoiceId is not null ? "kokoro" : (string?)null,
                    ttsConfig    = new { speed = 1.0 },
                    appearance   = new { },
                    responseBehavior   = new { },
                    memorySettings     = new { },
                    autoPilot          = new { },
                    personalityConfig  = new { },
                });

                AddEntry(zip, "connectors.json", Array.Empty<object>());
            }

            if (includeBrain)
            {
                AddEntry(zip, "brain.json", new
                {
                    nodes = new[] { new { id = "n1", type = "LlmNode" } },
                    edges = Array.Empty<object>(),
                });
            }
        }
        ms.Position = 0;
        return ms;
    }

    private static void AddEntry<T>(ZipArchive zip, string name, T value)
    {
        var entry  = zip.CreateEntry(name);
        using var w = new StreamWriter(entry.Open(), Encoding.UTF8);
        w.Write(JsonSerializer.Serialize(value));
    }

    private static (IInktFileImportService svc, Dictionary<string, string> redisStore) BuildService(
        IProjectImportCatalogQuery? catalog  = null,
        IAiCardService?             cardSvc  = null,
        IProjectRepository?         projRepo = null)
    {
        catalog  ??= Substitute.For<IProjectImportCatalogQuery>();
        cardSvc  ??= Substitute.For<IAiCardService>();
        projRepo ??= Substitute.For<IProjectRepository>();

        var cache = new MemoryDistributedCache(Options.Create(new MemoryDistributedCacheOptions()));

        projRepo.CreateAsync(Arg.Any<ProjectEntity>(), Arg.Any<CancellationToken>())
            .Returns(call => Task.FromResult(call.ArgAt<ProjectEntity>(0)));

        var store = new Dictionary<string, string>();
        var svc   = new InktFileImportService(projRepo, cardSvc, catalog, cache);
        return (svc, store);
    }

    // ── ParseAsync tests ─────────────────────────────────────────────────────

    [Fact]
    public async Task ParseAsync_ReturnsError_WhenStreamIsCorrupted()
    {
        var (svc, _) = BuildService();
        var garbage  = new MemoryStream(Encoding.UTF8.GetBytes("not a zip"));

        var result = await svc.ParseAsync(UserId, garbage);

        Assert.NotEmpty(result.Errors);
        Assert.Empty(result.ParseToken);
    }

    [Fact]
    public async Task ParseAsync_ReturnsError_WhenFormatVersionUnsupported()
    {
        var (svc, _) = BuildService();
        using var stream = MakeValidInkt(formatVersion: 99);

        var result = await svc.ParseAsync(UserId, stream);

        Assert.Contains(result.Errors, e => e.Contains("99"));
        Assert.Empty(result.ParseToken);
    }

    [Fact]
    public async Task ParseAsync_ReturnsWarning_WhenLlmModelNotInCatalog()
    {
        var catalog = Substitute.For<IProjectImportCatalogQuery>();
        catalog.FindLlmByModelIdAsync("gpt-4o", Arg.Any<CancellationToken>())
               .Returns((CatalogEntryRef?)null);

        var (svc, _) = BuildService(catalog: catalog);
        using var stream = MakeValidInkt(includeSoul: true, llmModelId: "gpt-4o");

        var result = await svc.ParseAsync(UserId, stream);

        Assert.Empty(result.Errors);
        Assert.Contains(result.Warnings, w => w.Contains("gpt-4o"));
    }

    [Fact]
    public async Task ParseAsync_ReturnsWarning_WhenRequiredFeatureIsLocalTts()
    {
        var (svc, _) = BuildService();
        using var stream = MakeValidInkt(
            requiredFeatures: ["tts:local:kokoro"]);

        var result = await svc.ParseAsync(UserId, stream);

        Assert.Empty(result.Errors);
        Assert.Contains(result.Warnings, w => w.Contains("kokoro"));
    }

    [Fact]
    public async Task ParseAsync_ReturnsNonEmptyToken_WhenSuccessful()
    {
        var (svc, _) = BuildService();
        using var stream = MakeValidInkt(projectName: "Token Test");

        var result = await svc.ParseAsync(UserId, stream);

        Assert.Empty(result.Errors);
        Assert.NotEmpty(result.ParseToken);
    }

    [Fact]
    public async Task ParseAsync_SetsSoulName_WhenSoulPresent()
    {
        var catalog = Substitute.For<IProjectImportCatalogQuery>();
        catalog.FindLlmByModelIdAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
               .Returns(new CatalogEntryRef(IdGenerator.New()));

        var (svc, _) = BuildService(catalog: catalog);
        using var stream = MakeValidInkt(includeSoul: true);

        var result = await svc.ParseAsync(UserId, stream);

        Assert.Equal("Aria", result.SoulName);
    }

    // ── FinalizeAsync tests ───────────────────────────────────────────────────

    [Fact]
    public async Task FinalizeAsync_Throws_WhenTokenExpired()
    {
        var (svc, _) = BuildService();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.FinalizeAsync(UserId, new InktFileFinalizeCommand("nonexistent-token", null, true)));
    }

    [Fact]
    public async Task FinalizeAsync_CreatesNewSoul_WhenTargetSoulIdIsNull()
    {
        var newCardId = IdGenerator.New();
        var catalog   = Substitute.For<IProjectImportCatalogQuery>();
        catalog.FindLlmByModelIdAsync("gpt-4o", Arg.Any<CancellationToken>())
               .Returns(new CatalogEntryRef(IdGenerator.New()));

        var cardSvc = Substitute.For<IAiCardService>();
        cardSvc.CreateFromImportAsync(UserId, Arg.Any<ImportSoulCommand>(), Arg.Any<CancellationToken>())
               .Returns(newCardId);

        var (svc, _) = BuildService(catalog: catalog, cardSvc: cardSvc);
        using var stream = MakeValidInkt(includeSoul: true);
        var parseResult = await svc.ParseAsync(UserId, stream);

        var finalize = await svc.FinalizeAsync(UserId,
            new InktFileFinalizeCommand(parseResult.ParseToken, TargetSoulId: null, ImportConnectorsDisabled: true));

        Assert.Equal(newCardId, finalize.SoulId);
        await cardSvc.Received(1).CreateFromImportAsync(UserId, Arg.Any<ImportSoulCommand>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task FinalizeAsync_UsesExistingSoul_WhenTargetSoulIdProvided()
    {
        var existingSoulId = IdGenerator.New();
        var cardSvc        = Substitute.For<IAiCardService>();

        var (svc, _) = BuildService(cardSvc: cardSvc);
        using var stream = MakeValidInkt(includeSoul: true);
        var parseResult = await svc.ParseAsync(UserId, stream);

        var finalize = await svc.FinalizeAsync(UserId,
            new InktFileFinalizeCommand(parseResult.ParseToken, TargetSoulId: existingSoulId, ImportConnectorsDisabled: true));

        Assert.Equal(existingSoulId, finalize.SoulId);
        await cardSvc.DidNotReceive().CreateFromImportAsync(Arg.Any<Guid>(), Arg.Any<ImportSoulCommand>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task FinalizeAsync_ThrowsOnSecondCall_AfterSuccessfulImport()
    {
        var catalog = Substitute.For<IProjectImportCatalogQuery>();
        catalog.FindLlmByModelIdAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
               .Returns(new CatalogEntryRef(IdGenerator.New()));

        var cardSvc = Substitute.For<IAiCardService>();
        cardSvc.CreateFromImportAsync(UserId, Arg.Any<ImportSoulCommand>(), Arg.Any<CancellationToken>())
               .Returns(IdGenerator.New());

        var (svc, _) = BuildService(catalog: catalog, cardSvc: cardSvc);
        using var stream = MakeValidInkt(includeSoul: true);
        var parseResult = await svc.ParseAsync(UserId, stream);

        await svc.FinalizeAsync(UserId, new InktFileFinalizeCommand(parseResult.ParseToken, null, true));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.FinalizeAsync(UserId, new InktFileFinalizeCommand(parseResult.ParseToken, null, true)));
    }

    [Fact]
    public async Task FinalizeAsync_Throws_WhenUserIdDoesNotMatch()
    {
        var (svc, _) = BuildService();
        using var stream = MakeValidInkt();
        var parseResult = await svc.ParseAsync(UserId, stream);

        var differentUser = IdGenerator.New();
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            svc.FinalizeAsync(differentUser,
                new InktFileFinalizeCommand(parseResult.ParseToken, null, true)));
    }
}
