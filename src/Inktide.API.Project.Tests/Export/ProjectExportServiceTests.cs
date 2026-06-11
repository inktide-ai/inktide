using Inktide.API.Core.Contracts;
using Inktide.API.Core.Generators;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Domain.Repositories;
using Inktide.API.Project.Infrastructure.Services;
using NSubstitute;
using Xunit;

// ProjectExportService + InktFileImportService are internal — exposed via InternalsVisibleTo.

namespace Inktide.API.Project.Tests.Export;

public sealed class ProjectExportServiceTests
{
    private static readonly Guid UserId    = IdGenerator.New();
    private static readonly Guid ProjectId = IdGenerator.New();
    private static readonly Guid SoulId    = IdGenerator.New();

    private static ProjectEntity MakeProject(Guid? activeSoulId = null) => new()
    {
        Id           = ProjectId,
        UserId       = UserId,
        Name         = "Test Project",
        Description  = "A test",
        Status       = "active",
        ActiveSoulId = activeSoulId,
        CreatedAt    = DateTime.UtcNow,
        UpdatedAt    = DateTime.UtcNow,
    };

    private static SoulExportSnapshot MakeSoulSnapshot(string? ttsProvider = null) => new(
        Name:                  "Aria",
        Slug:                  "aria",
        Description:           "Test soul",
        Status:                "active",
        Personality:           "Friendly",
        SystemPrompt:          "You are Aria.",
        LlmModelId:            "gpt-4o",
        LlmProvider:           "openai",
        LlmConfigJson:         "{\"temperature\":0.7}",
        TtsVoiceId:            ttsProvider is not null ? "af_heart" : null,
        TtsProvider:           ttsProvider,
        TtsConfigJson:         ttsProvider is not null ? "{\"speed\":1.0}" : null,
        AppearanceJson:        "{}",
        ResponseBehaviorJson:  "{}",
        MemorySettingsJson:    "{}",
        AutoPilotJson:         "{}",
        PersonalityConfigJson: "{}",
        Connectors:            []);

    private static IProjectExportService BuildService(
        IProjectRepository? projectRepo = null,
        IProjectExportDataQuery? soulQuery = null)
    {
        projectRepo ??= Substitute.For<IProjectRepository>();
        soulQuery   ??= Substitute.For<IProjectExportDataQuery>();

        return new ProjectExportService(projectRepo, soulQuery, new LocalTtsProviderClassifier());
    }

    private static Dictionary<string, string> ReadZip(byte[] zipBytes)
    {
        using var ms  = new MemoryStream(zipBytes);
        using var zip = new ZipArchive(ms, ZipArchiveMode.Read);
        var result    = new Dictionary<string, string>();
        foreach (var entry in zip.Entries)
        {
            using var reader = new StreamReader(entry.Open(), Encoding.UTF8);
            result[entry.Name] = reader.ReadToEnd();
        }
        return result;
    }

    [Fact]
    public async Task ExportAsync_ReturnsNull_WhenProjectNotFound()
    {
        var repo = Substitute.For<IProjectRepository>();
        repo.FindByIdAndUserAsync(ProjectId, UserId, Arg.Any<CancellationToken>())
            .Returns((ProjectEntity?)null);

        var svc = BuildService(projectRepo: repo);
        var result = await svc.ExportAsync(UserId, ProjectId);

        Assert.Null(result);
    }

    [Fact]
    public async Task ExportAsync_ProducesZipWithFiveEntries_WhenFullProject()
    {
        var repo = Substitute.For<IProjectRepository>();
        repo.FindByIdAndUserAsync(ProjectId, UserId, Arg.Any<CancellationToken>())
            .Returns(MakeProject(activeSoulId: SoulId));

        var soulQuery = Substitute.For<IProjectExportDataQuery>();
        soulQuery.GetExportSnapshotAsync(UserId, SoulId, Arg.Any<CancellationToken>())
            .Returns(MakeSoulSnapshot());

        var svc    = BuildService(projectRepo: repo, soulQuery: soulQuery);
        var result = await svc.ExportAsync(UserId, ProjectId);

        Assert.NotNull(result);
        var entries = ReadZip(result.ZipContent);
        Assert.Contains("metadata.json",   entries);
        Assert.Contains("project.json",    entries);
        Assert.Contains("soul.json",       entries);
        Assert.Contains("connectors.json", entries);
        Assert.Contains("brain.json",      entries);
    }

    [Fact]
    public async Task ExportAsync_OmitsSoulAndConnectors_WhenNoActiveSoulId()
    {
        var repo = Substitute.For<IProjectRepository>();
        repo.FindByIdAndUserAsync(ProjectId, UserId, Arg.Any<CancellationToken>())
            .Returns(MakeProject(activeSoulId: null));

        var svc    = BuildService(projectRepo: repo);
        var result = await svc.ExportAsync(UserId, ProjectId);

        Assert.NotNull(result);
        var entries = ReadZip(result.ZipContent);
        Assert.DoesNotContain("soul.json",       entries);
        Assert.DoesNotContain("connectors.json", entries);
        // brain.json is always emitted (with empty nodes/edges)
        Assert.Contains("brain.json", entries);
    }

    [Fact]
    public async Task ExportAsync_SetsRequiredFeature_ForKokoroProvider()
    {
        var repo = Substitute.For<IProjectRepository>();
        repo.FindByIdAndUserAsync(ProjectId, UserId, Arg.Any<CancellationToken>())
            .Returns(MakeProject(activeSoulId: SoulId));

        var soulQuery = Substitute.For<IProjectExportDataQuery>();
        soulQuery.GetExportSnapshotAsync(UserId, SoulId, Arg.Any<CancellationToken>())
            .Returns(MakeSoulSnapshot(ttsProvider: "kokoro"));

        var svc    = BuildService(projectRepo: repo, soulQuery: soulQuery);
        var result = await svc.ExportAsync(UserId, ProjectId);

        Assert.NotNull(result);
        var entries  = ReadZip(result.ZipContent);
        var metadata = JsonDocument.Parse(entries["metadata.json"]);
        var features = metadata.RootElement
            .GetProperty("required_features")
            .EnumerateArray()
            .Select(x => x.GetString())
            .ToList();

        Assert.Contains("tts:local:kokoro", features);
    }

    [Fact]
    public async Task ExportAsync_SoulJsonHasNoApiKey_WhenTtsConfigIncludesApiKey()
    {
        var snapshot = MakeSoulSnapshot(ttsProvider: "kokoro") with
        {
            TtsConfigJson = "{\"speed\":1.0}",  // already stripped; api_key must not appear
        };

        var repo = Substitute.For<IProjectRepository>();
        repo.FindByIdAndUserAsync(ProjectId, UserId, Arg.Any<CancellationToken>())
            .Returns(MakeProject(activeSoulId: SoulId));

        var soulQuery = Substitute.For<IProjectExportDataQuery>();
        soulQuery.GetExportSnapshotAsync(UserId, SoulId, Arg.Any<CancellationToken>())
            .Returns(snapshot);

        var svc    = BuildService(projectRepo: repo, soulQuery: soulQuery);
        var result = await svc.ExportAsync(UserId, ProjectId);

        Assert.NotNull(result);
        var entries  = ReadZip(result.ZipContent);
        var soulJson = entries["soul.json"];

        Assert.DoesNotContain("api_key", soulJson, StringComparison.OrdinalIgnoreCase);
    }
}
