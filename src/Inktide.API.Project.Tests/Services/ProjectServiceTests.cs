using Inktide.API.Core.Generators;
using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Domain.Repositories;
using Inktide.API.Project.Domain.ValueObjects;
using Inktide.API.Project.Infrastructure.Services;
using NSubstitute;
using Xunit;

namespace Inktide.API.Project.Tests.Services;

public sealed class ProjectServiceTests
{
    private static readonly Guid UserId    = IdGenerator.New();
    private static readonly Guid ProjectId = IdGenerator.New();

    private static ProjectEntity MakeProject(string sortKey = "a0") => new()
    {
        Id        = ProjectId,
        UserId    = UserId,
        Name      = "Test",
        Status    = "active",
        SortKey   = sortKey,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
    };

    private static ProjectService BuildService(IProjectRepository repo) => new(repo);

    // ── ReorderAsync ─────────────────────────────────────────────────────────

    [Fact]
    public async Task ReorderAsync_PlacesAtBeginning_WhenPreviousIdIsNull()
    {
        var otherId  = IdGenerator.New();
        var otherKey = "a1";
        var repo     = Substitute.For<IProjectRepository>();
        repo.FindByIdAndUserAsync(ProjectId, UserId, Arg.Any<CancellationToken>())
            .Returns(MakeProject("a0"));
        repo.GetSortKeysAsync(UserId, Arg.Any<CancellationToken>())
            .Returns(new List<(Guid Id, string SortKey)>
            {
                (ProjectId, "a0"),
                (otherId,   otherKey),
            }.AsReadOnly());

        var svc = BuildService(repo);
        // Move ProjectId before otherId (previousId=null means beginning, nextId=otherId)
        var result = await svc.ReorderAsync(ProjectId, UserId, previousId: null, nextId: otherId);

        Assert.NotNull(result);
        Assert.True(string.Compare(result!.SortKey, otherKey, StringComparison.Ordinal) < 0);
    }

    [Fact]
    public async Task ReorderAsync_PlacesAtEnd_WhenNextIdIsNull()
    {
        var repo = Substitute.For<IProjectRepository>();
        repo.FindByIdAndUserAsync(ProjectId, UserId, Arg.Any<CancellationToken>())
            .Returns(MakeProject("a0"));
        repo.GetSortKeysAsync(UserId, Arg.Any<CancellationToken>())
            .Returns(new List<(Guid Id, string SortKey)>
            {
                (ProjectId, "a0"),
            }.AsReadOnly());

        var svc = BuildService(repo);
        var result = await svc.ReorderAsync(ProjectId, UserId, previousId: ProjectId, nextId: null);

        Assert.NotNull(result);
        Assert.True(string.Compare(result!.SortKey, "a0", StringComparison.Ordinal) > 0);
    }

    [Fact]
    public async Task ReorderAsync_ReturnsNull_WhenProjectNotFound()
    {
        var repo = Substitute.For<IProjectRepository>();
        repo.FindByIdAndUserAsync(ProjectId, UserId, Arg.Any<CancellationToken>())
            .Returns((ProjectEntity?)null);

        var svc = BuildService(repo);
        var result = await svc.ReorderAsync(ProjectId, UserId, null, null);

        Assert.Null(result);
    }

    // ── CreateAsync ──────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateAsync_AssignsSortKeyAfterLast()
    {
        var lastKey = "a0";
        var repo    = Substitute.For<IProjectRepository>();
        repo.GetSortKeysAsync(UserId, Arg.Any<CancellationToken>())
            .Returns(new List<(Guid Id, string SortKey)> { (IdGenerator.New(), lastKey) }.AsReadOnly());
        repo.CreateAsync(Arg.Any<ProjectEntity>(), Arg.Any<CancellationToken>())
            .Returns(call => Task.FromResult(call.ArgAt<ProjectEntity>(0)));

        var svc    = BuildService(repo);
        var result = await svc.CreateAsync(UserId, "Project", null, null);

        Assert.True(string.Compare(result.SortKey, lastKey, StringComparison.Ordinal) > 0);
    }

    // ── UpsertPluginAsync ─────────────────────────────────────────────────────

    [Fact]
    public async Task UpsertPluginAsync_AddsNewPlugin_WhenNotExists()
    {
        var project = MakeProject();
        var repo    = Substitute.For<IProjectRepository>();
        repo.FindByIdAndUserAsync(ProjectId, UserId, Arg.Any<CancellationToken>())
            .Returns(project);
        repo.UpdateAsync(Arg.Any<ProjectEntity>(), Arg.Any<CancellationToken>())
            .Returns(call => Task.FromResult(call.ArgAt<ProjectEntity>(0)));

        var svc    = BuildService(repo);
        var plugin = await svc.UpsertPluginAsync(ProjectId, UserId, "my-plugin", isEnabled: true, null);

        Assert.Equal("my-plugin", plugin.PluginId);
        Assert.True(plugin.IsEnabled);
        Assert.Single(project.Plugins);
    }

    [Fact]
    public async Task UpsertPluginAsync_UpdatesExistingPlugin()
    {
        var project = MakeProject();
        project.Plugins.Add(new ProjectPlugin("my-plugin", IsEnabled: false, Config: []));

        var repo = Substitute.For<IProjectRepository>();
        repo.FindByIdAndUserAsync(ProjectId, UserId, Arg.Any<CancellationToken>())
            .Returns(project);
        repo.UpdateAsync(Arg.Any<ProjectEntity>(), Arg.Any<CancellationToken>())
            .Returns(call => Task.FromResult(call.ArgAt<ProjectEntity>(0)));

        var svc    = BuildService(repo);
        var plugin = await svc.UpsertPluginAsync(ProjectId, UserId, "my-plugin", isEnabled: true, null);

        Assert.True(plugin.IsEnabled);
        Assert.Single(project.Plugins);
    }
}
