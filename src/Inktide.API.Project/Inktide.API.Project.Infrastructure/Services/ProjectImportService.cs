using Inktide.API.Core.Contracts;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.Domain.Repositories;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Enums;

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

        // 1. Create Soul (AiCard) if the bundle contains soul data.
        if (command.Soul is not null)
        {
            var s = command.Soul;
            var card = new AiCard
            {
                Name             = s.Name,
                Personality      = s.Personality ?? string.Empty,
                SystemPrompt     = s.SystemPrompt,
                AvatarUrl        = s.AvatarUrl,
                Description      = s.Description ?? string.Empty,
                Status           = Enum.TryParse<AiCardStatus>(s.Status, ignoreCase: true, out var st)
                                       ? st : AiCardStatus.Active,
                CoverUrl         = s.CoverUrl,
                LlmCatalogId     = s.LlmCatalogId,
                LlmConfig        = s.LlmConfig,
                TtsCatalogId     = s.TtsCatalogId,
                TtsConfig        = s.TtsConfig,
                Appearance       = s.Appearance,
                ResponseBehavior = s.ResponseBehavior,
                MemorySettings   = s.MemorySettings,
                AutoPilot        = s.AutoPilot,
            };

            var created = await _cardService.CreateAsync(userId, card, ct: ct).ConfigureAwait(false);
            soulId = created.Id;
        }

        // 2. Create Project, linking the Soul if one was just created.
        var project = Domain.Entities.ProjectEntity.Create(userId, command.ProjectName, null, soulId);
        await _projectRepo.CreateAsync(project, ct).ConfigureAwait(false);

        // 3. Import graph directly (Graph.Infrastructure implements IGraphDefinitionImporter).
        if (command.GraphPayloadJson is not null && _graphImporter is not null)
        {
            await _graphImporter.ImportAsync(project.Id, userId, command.GraphPayloadJson, ct)
                .ConfigureAwait(false);
        }

        return new ImportProjectResult(project.Id, soulId);
    }
}
