using System.Security.Claims;
using Inktide.API.Core.Contracts;
using Inktide.API.Core.Generators;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.REST.Controllers;
using Inktide.API.Project.REST.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
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
        crud      ??= Substitute.For<IProjectCrudService>();
        order     ??= Substitute.For<IProjectOrderingService>();
        plugins   ??= Substitute.For<IProjectPluginService>();
        importer  ??= Substitute.For<IProjectImportService>();
        exporter  ??= Substitute.For<IProjectExportService>();
        inkt      ??= Substitute.For<IInktFileImportService>();
        summaries ??= Substitute.For<ICardSummaryProvider>();

        summaries.GetSummariesAsync(Arg.Any<IEnumerable<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, CardSummary>());

        var controller = new ProjectController(crud, order, plugins, importer, exporter, inkt, summaries);
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
        var result = await ctrl.List(soulId: null, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Create_Returns201_WithLocation()
    {
        var project = MakeProject();
        var crud    = Substitute.For<IProjectCrudService>();
        crud.CreateAsync(UserId, Arg.Any<string>(), Arg.Any<string?>(), Arg.Any<Guid?>(), Arg.Any<CancellationToken>())
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
}
