using Inktide.API.Core.Contracts;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.Domain.Repositories;
using Inktide.API.Soul.Application.Interfaces;

namespace Inktide.API.Project.Infrastructure.Services;

internal sealed class ProjectImportService : Application.Interfaces.IProjectImportService
{
    private readonly IProjectRepository _projectRepo;
    private readonly IAiCardService _cardService;
    private readonly IGraphDefinitionImporter? _graphImporter;

    public ProjectImportService(
        IProjectRepository projectRepo,
        IAiCardService cardService,
        IGraphDefinitionImporter? graphImporter = null)
    {
        _projectRepo   = projectRepo   ?? throw new ArgumentNullException(nameof(projectRepo));
        _cardService   = cardService   ?? throw new ArgumentNullException(nameof(cardService));
        _graphImporter = graphImporter;
    }

    public async Task<ImportProjectResult> ImportAsync(
        Guid userId,
        ImportProjectCommand command,
        CancellationToken ct = default)
    {
        Guid? soulId = null;

        if (command.Soul is not null)
        {
            var s = command.Soul;
            var cmd = new ImportSoulCommand(
                Name:                 s.Name,
                Personality:          s.Personality          ?? string.Empty,
                SystemPrompt:         s.SystemPrompt,
                Description:          s.Description          ?? string.Empty,
                Status:               s.Status,
                LlmCatalogId:         s.LlmCatalogId,
                LlmConfig:            s.LlmConfig,
                TtsCatalogId:         s.TtsCatalogId,
                TtsConfig:            s.TtsConfig,
                Appearance:           s.Appearance,
                ResponseBehavior:     s.ResponseBehavior,
                MemorySettings:       s.MemorySettings,
                AutoPilot:            s.AutoPilot,
                PersonalityConfigJson: null);

            soulId = await _cardService.CreateFromImportAsync(userId, cmd, ct).ConfigureAwait(false);
        }

        var project = Domain.Entities.ProjectEntity.Create(userId, command.ProjectName, null, soulId);
        await _projectRepo.CreateAsync(project, ct).ConfigureAwait(false);

        if (command.GraphPayloadJson is not null && _graphImporter is not null)
        {
            await _graphImporter.ImportAsync(project.Id, userId, command.GraphPayloadJson, ct)
                .ConfigureAwait(false);
        }

        return new ImportProjectResult(project.Id, soulId);
    }
}
