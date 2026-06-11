using System.Security.Claims;
using Inktide.API.Core.Contracts;
using Inktide.API.Core.Generators;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Domain.ValueObjects;
using Inktide.API.Project.REST.Controllers;
using Inktide.API.Project.REST.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Xunit;

namespace Inktide.API.Project.Tests.REST;

public sealed class ProjectControllerTests
{
    private static readonly Guid UserId    = IdGenerator.New();
    private static readonly Guid ProjectId = IdGenerator.New();

    private static ProjectEntity MakeProject() => new()
    {
        Id        = ProjectId,
        UserId    = UserId,
        Name      = "Test",
        Status    = "active",
        SortKey   = "a0",
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
    };

    private static ProjectController BuildController(
        IProjectCrudService? crud       = null,
        IProjectOrderingService? order  = null,
        IProjectPluginService? plugins  = null,
        IProjectImportService? importer = null,
        IProjectExportService? exporter = null,
        IInktFileImportService? inkt    = null,
        ICardSummaryProvider? summaries = null)
    {
        crud        ??= Substitute.For<IProjectCrudService>();
        order       ??= Substitute.For<IProjectOrderingService>();
        plugins     ??= Substitute.For<IProjectPluginService>();
        importer    ??= Substitute.For<IProjectImportService>();
        exporter    ??= Substitute.For<IProjectExportService>();
        inkt        ??= Substitute.For<IInktFileImportService>();
        summaries   ??= Substitute.For<ICardSummaryProvider>();
        var scene   = Substitute.For<IProjectSceneConfigService>();

        summaries.GetSummariesAsync(Arg.Any<IEnumerable<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, CardSummary>());

        var controller = new ProjectController(crud, order, plugins, importer, exporter, inkt, summaries, scene);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                [
                    new Claim(ClaimTypes.NameIdentifier, UserId.ToString()),
                ]))
            }
        };
        return controller;
    }

    [Fact]
    public async Task List_Returns200_WithProjectList()
    {
        var crud = Substitute.For<IProjectCrudService>();
        crud.ListAsync(UserId, Arg.Any<CancellationToken>())
            .Returns(new List<ProjectEntity> { MakeProject() }.AsReadOnly());

        var ctrl   = BuildController(crud: crud);
        var result = await ctrl.List(soulId: null, ct: CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Create_Returns201_WithLocation()
    {
        var project = MakeProject();
        var crud    = Substitute.For<IProjectCrudService>();
        crud.CreateAsync(UserId, Arg.Any<string>(), Arg.Any<string?>(), Arg.Any<Guid?>(),
                Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>(),
                Arg.Any<CancellationToken>())
            .Returns(project);

        var ctrl   = BuildController(crud: crud);
        var result = await ctrl.Create(new CreateProjectRequest { Name = "Test" }, CancellationToken.None);

        var created = Assert.IsType<CreatedResult>(result);
        Assert.Contains(ProjectId.ToString(), created.Location ?? string.Empty);
    }

    [Fact]
    public async Task Get_Returns404_WhenProjectNotFound()
    {
        var crud = Substitute.For<IProjectCrudService>();
        crud.GetAsync(ProjectId, UserId, Arg.Any<CancellationToken>())
            .Returns((ProjectEntity?)null);

        var ctrl   = BuildController(crud: crud);
        var result = await ctrl.Get(ProjectId, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Delete_Returns204_WhenDeleted()
    {
        var crud = Substitute.For<IProjectCrudService>();
        crud.DeleteAsync(ProjectId, UserId, Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var ctrl   = BuildController(crud: crud);
        var result = await ctrl.Delete(ProjectId, CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task Update_Returns200_OnSuccess()
    {
        var crud = Substitute.For<IProjectCrudService>();
        crud.UpdateAsync(ProjectId, UserId,
                Arg.Any<string>(), Arg.Any<string?>(), Arg.Any<string?>(),
                Arg.Any<Guid?>(), Arg.Any<Guid?>(), Arg.Any<string?>(), Arg.Any<string?>(),
                Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<CancellationToken>())
            .Returns(MakeProject());

        var ctrl   = BuildController(crud: crud);
        var result = await ctrl.Update(ProjectId, new UpdateProjectRequest { Name = "Updated" }, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Update_Returns404_WhenNotFound()
    {
        var crud = Substitute.For<IProjectCrudService>();
        crud.UpdateAsync(ProjectId, UserId,
                Arg.Any<string>(), Arg.Any<string?>(), Arg.Any<string?>(),
                Arg.Any<Guid?>(), Arg.Any<Guid?>(), Arg.Any<string?>(), Arg.Any<string?>(),
                Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<CancellationToken>())
            .Throws(new KeyNotFoundException());

        var ctrl   = BuildController(crud: crud);
        var result = await ctrl.Update(ProjectId, new UpdateProjectRequest { Name = "Updated" }, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task BindSoul_Returns200_OnSuccess()
    {
        var soulId = IdGenerator.New();
        var crud   = Substitute.For<IProjectCrudService>();
        crud.BindSoulAsync(ProjectId, UserId, soulId, Arg.Any<CancellationToken>())
            .Returns(MakeProject());

        var ctrl   = BuildController(crud: crud);
        var result = await ctrl.BindSoul(ProjectId, new BindSoulRequest { SoulId = soulId }, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task BindSoul_Returns404_WhenNotFound()
    {
        var soulId = IdGenerator.New();
        var crud   = Substitute.For<IProjectCrudService>();
        crud.BindSoulAsync(ProjectId, UserId, soulId, Arg.Any<CancellationToken>())
            .Throws(new KeyNotFoundException());

        var ctrl   = BuildController(crud: crud);
        var result = await ctrl.BindSoul(ProjectId, new BindSoulRequest { SoulId = soulId }, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task UnbindSoul_Returns200_OnSuccess()
    {
        var crud = Substitute.For<IProjectCrudService>();
        crud.UnbindSoulAsync(ProjectId, UserId, Arg.Any<CancellationToken>())
            .Returns(MakeProject());

        var ctrl   = BuildController(crud: crud);
        var result = await ctrl.UnbindSoul(ProjectId, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Export_Returns200_WithZipContent()
    {
        var exporter = Substitute.For<IProjectExportService>();
        exporter.ExportAsync(UserId, ProjectId, Arg.Any<CancellationToken>())
            .Returns(new ProjectExportResult("project.inkt", [0x50, 0x4B]));

        var ctrl   = BuildController(exporter: exporter);
        var result = await ctrl.Export(new ExportProjectRequest { ProjectId = ProjectId }, CancellationToken.None);

        Assert.IsType<FileContentResult>(result);
    }

    [Fact]
    public async Task Export_Returns404_WhenProjectNotFound()
    {
        var exporter = Substitute.For<IProjectExportService>();
        exporter.ExportAsync(UserId, ProjectId, Arg.Any<CancellationToken>())
            .Returns((ProjectExportResult?)null);

        var ctrl   = BuildController(exporter: exporter);
        var result = await ctrl.Export(new ExportProjectRequest { ProjectId = ProjectId }, CancellationToken.None);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task ParseImport_Returns400_WhenNoFile()
    {
        var ctrl   = BuildController();
        var result = await ctrl.ParseImport(file: null, CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task ParseImport_Returns400_WhenWrongExtension()
    {
        var file = Substitute.For<IFormFile>();
        file.FileName.Returns("project.zip");
        file.Length.Returns(100L);

        var ctrl   = BuildController();
        var result = await ctrl.ParseImport(file, CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task FinalizeImport_Returns201_OnSuccess()
    {
        var inkt = Substitute.For<IInktFileImportService>();
        inkt.FinalizeAsync(UserId, Arg.Any<InktFileFinalizeCommand>(), Arg.Any<CancellationToken>())
            .Returns(new InktFileFinalizeResult(ProjectId, null));

        var ctrl   = BuildController(inkt: inkt);
        var result = await ctrl.FinalizeImport(
            new FinalizeImportRequest { ParseToken = "tok123" }, CancellationToken.None);

        var created = Assert.IsType<CreatedResult>(result);
        Assert.Contains(ProjectId.ToString(), created.Location ?? string.Empty);
    }

    [Fact]
    public async Task FinalizeImport_Returns400_WhenTokenExpired()
    {
        var inkt = Substitute.For<IInktFileImportService>();
        inkt.FinalizeAsync(UserId, Arg.Any<InktFileFinalizeCommand>(), Arg.Any<CancellationToken>())
            .Throws(new InvalidOperationException("Parse token expired."));

        var ctrl   = BuildController(inkt: inkt);
        var result = await ctrl.FinalizeImport(
            new FinalizeImportRequest { ParseToken = "tok123" }, CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetPlugins_Returns200_WithList()
    {
        var plugin  = new ProjectPlugin("my-plugin", IsEnabled: true, Config: []);
        var plugins = Substitute.For<IProjectPluginService>();
        plugins.GetPluginsAsync(ProjectId, UserId, Arg.Any<CancellationToken>())
            .Returns(new List<ProjectPlugin> { plugin }.AsReadOnly());

        var ctrl   = BuildController(plugins: plugins);
        var result = await ctrl.GetPlugins(ProjectId, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task UpsertPlugin_Returns200_WithUpdatedPlugin()
    {
        var plugin  = new ProjectPlugin("my-plugin", IsEnabled: true, Config: []);
        var plugins = Substitute.For<IProjectPluginService>();
        plugins.UpsertPluginAsync(ProjectId, UserId, "my-plugin", true, Arg.Any<Dictionary<string, string>?>(), Arg.Any<CancellationToken>())
            .Returns(plugin);

        var ctrl   = BuildController(plugins: plugins);
        var result = await ctrl.UpsertPlugin(
            ProjectId, "my-plugin", new UpsertPluginRequest { IsEnabled = true }, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ProjectPluginResponse>(ok.Value);
        Assert.True(response.IsEnabled);
    }

    [Fact]
    public async Task Reorder_Returns200_OnSuccess()
    {
        var order = Substitute.For<IProjectOrderingService>();
        order.ReorderAsync(ProjectId, UserId, Arg.Any<Guid?>(), Arg.Any<Guid?>(), Arg.Any<CancellationToken>())
            .Returns(MakeProject());

        var ctrl   = BuildController(order: order);
        var result = await ctrl.Reorder(
            ProjectId, new ReorderProjectRequest { PreviousId = null, NextId = null }, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Reorder_Returns404_WhenProjectNotFound()
    {
        var order = Substitute.For<IProjectOrderingService>();
        order.ReorderAsync(ProjectId, UserId, Arg.Any<Guid?>(), Arg.Any<Guid?>(), Arg.Any<CancellationToken>())
            .Returns((ProjectEntity?)null);

        var ctrl   = BuildController(order: order);
        var result = await ctrl.Reorder(
            ProjectId, new ReorderProjectRequest { PreviousId = null, NextId = null }, CancellationToken.None);

        Assert.IsType<NotFoundObjectResult>(result);
    }
}
