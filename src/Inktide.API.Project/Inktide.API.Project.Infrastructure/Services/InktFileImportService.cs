using Inktide.API.Core.Generators;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using Inktide.API.Core.Contracts;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Domain.Repositories;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Enums;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Domain.ValueObjects;
using Microsoft.Extensions.Caching.Distributed;

namespace Inktide.API.Project.Infrastructure.Services;

internal sealed class InktFileImportService : IInktFileImportService
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private const int CurrentFormatVersion = 1;
    private static readonly TimeSpan ParseTokenTtl = TimeSpan.FromMinutes(10);

    private readonly IProjectRepository _projectRepo;
    private readonly IAiCardService _cardService;
    private readonly ICatalogRepository _catalog;
    private readonly IGraphDefinitionImporter? _graphImporter;
    private readonly IDistributedCache _cache;

    public InktFileImportService(
        IProjectRepository projectRepo,
        IAiCardService cardService,
        ICatalogRepository catalog,
        IDistributedCache cache,
        IGraphDefinitionImporter? graphImporter = null)
    {
        _projectRepo   = projectRepo   ?? throw new ArgumentNullException(nameof(projectRepo));
        _cardService   = cardService   ?? throw new ArgumentNullException(nameof(cardService));
        _catalog       = catalog       ?? throw new ArgumentNullException(nameof(catalog));
        _cache         = cache         ?? throw new ArgumentNullException(nameof(cache));
        _graphImporter = graphImporter;
    }

    public async Task<InktFileParseResult> ParseAsync(
        Guid userId,
        Stream inktFileStream,
        CancellationToken ct = default)
    {
        ZipArchive zip;
        try { zip = new ZipArchive(inktFileStream, ZipArchiveMode.Read, leaveOpen: false); }
        catch { return Error("File is not a valid .inkt archive."); }

        using (zip)
        {
            // metadata.json (required)
            var metaJson = ReadEntry(zip, "metadata.json");
            if (metaJson is null) return Error("Missing metadata.json in archive.");

            int formatVersion;
            List<string> requiredFeatures;
            try
            {
                using var metaDoc = JsonDocument.Parse(metaJson);
                var root = metaDoc.RootElement;
                if (!root.TryGetProperty("formatVersion", out var fv) || fv.ValueKind != JsonValueKind.Number)
                    return Error("metadata.json is missing formatVersion.");
                formatVersion = fv.GetInt32();
                requiredFeatures = root.TryGetProperty("requiredFeatures", out var rf) && rf.ValueKind == JsonValueKind.Array
                    ? rf.EnumerateArray().Select(x => x.GetString() ?? string.Empty).ToList()
                    : [];
            }
            catch { return Error("metadata.json is corrupted or invalid."); }

            if (formatVersion != CurrentFormatVersion)
                return Error($"Unsupported format version {formatVersion}. This platform supports version {CurrentFormatVersion}.");

            // project.json (required)
            var projectJson = ReadEntry(zip, "project.json");
            if (projectJson is null) return Error("Missing project.json in archive.");

            string projectName;
            string? projectDesc = null;
            string? projectPrompt = null;
            try
            {
                using var projDoc = JsonDocument.Parse(projectJson);
                var root = projDoc.RootElement;
                projectName = GetString(root, "name") ?? string.Empty;
                projectDesc = GetString(root, "description");
                projectPrompt = GetString(root, "systemPrompt");
            }
            catch { return Error("project.json is corrupted or invalid."); }

            if (string.IsNullOrWhiteSpace(projectName))
                return Error("project.json is missing a project name.");

            // soul.json (optional) — parse into flat strings for Redis cache
            var soulRaw  = ReadEntry(zip, "soul.json");
            var brainRaw = ReadEntry(zip, "brain.json");
            var connRaw  = ReadEntry(zip, "connectors.json");

            string? soulName = null, soulPersonality = null, soulSystemPrompt = null;
            string? soulDescription = null, soulStatus = null;
            string? soulLlmModelId = null, soulLlmProvider = null, soulLlmConfig = null;
            string? soulTtsVoiceId = null, soulTtsProvider = null, soulTtsConfig = null;
            string? soulAppearance = null, soulResponseBehavior = null;
            string? soulMemorySettings = null, soulAutoPilot = null, soulPersonalityConfig = null;

            if (soulRaw is not null)
            {
                try
                {
                    using var soulDoc = JsonDocument.Parse(soulRaw);
                    var root = soulDoc.RootElement;
                    soulName             = GetString(root, "name");
                    soulPersonality      = GetString(root, "personality");
                    soulSystemPrompt     = GetString(root, "systemPrompt");
                    soulDescription      = GetString(root, "description");
                    soulStatus           = GetString(root, "status");
                    soulLlmModelId       = GetString(root, "llmModelId");
                    soulLlmProvider      = GetString(root, "llmProvider");
                    soulTtsVoiceId       = GetString(root, "ttsVoiceId");
                    soulTtsProvider      = GetString(root, "ttsProvider");
                    // JSONB object fields — serialize back to string for caching
                    soulLlmConfig        = GetRawJson(root, "llmConfig");
                    soulTtsConfig        = GetRawJson(root, "ttsConfig");
                    soulAppearance       = GetRawJson(root, "appearance");
                    soulResponseBehavior = GetRawJson(root, "responseBehavior");
                    soulMemorySettings   = GetRawJson(root, "memorySettings");
                    soulAutoPilot        = GetRawJson(root, "autoPilot");
                    soulPersonalityConfig = GetRawJson(root, "personalityConfig");
                }
                catch { /* treat as no soul */ }
            }

            int connectorCount = 0;
            if (connRaw is not null)
            {
                try
                {
                    using var connDoc = JsonDocument.Parse(connRaw);
                    if (connDoc.RootElement.ValueKind == JsonValueKind.Array)
                        connectorCount = connDoc.RootElement.GetArrayLength();
                }
                catch { /* non-critical */ }
            }

            var warnings = new List<string>();
            Guid? resolvedLlmId = null;
            Guid? resolvedTtsId = null;

            if (soulName is not null)
            {
                if (!string.IsNullOrWhiteSpace(soulLlmModelId))
                {
                    var llmEntry = await _catalog.FindLlmByModelIdAsync(soulLlmModelId, ct).ConfigureAwait(false);
                    if (llmEntry is null)
                        warnings.Add($"LLM model '{soulLlmModelId}' is not available on this platform — a fallback will be used.");
                    else
                        resolvedLlmId = llmEntry.Id;
                }

                if (!string.IsNullOrWhiteSpace(soulTtsVoiceId))
                {
                    var ttsEntry = await _catalog.FindTtsByVoiceIdAsync(soulTtsVoiceId, ct).ConfigureAwait(false);
                    if (ttsEntry is null)
                        warnings.Add($"TTS voice '{soulTtsVoiceId}' is not available on this platform — TTS will be disabled.");
                    else
                        resolvedTtsId = ttsEntry.Id;
                }
            }

            foreach (var feature in requiredFeatures)
            {
                if (feature.StartsWith("tts:local:", StringComparison.OrdinalIgnoreCase))
                    warnings.Add($"This project uses a local TTS provider ({feature.Split(':').Last()}) which must be installed and running.");
            }

            var token = IdGenerator.New().ToString("N");
            var context = new InktImportContext(
                UserId:               userId,
                ProjectName:          projectName,
                ProjectDesc:          projectDesc,
                ProjectPrompt:        projectPrompt,
                BrainJson:            brainRaw,
                ResolvedLlmId:        resolvedLlmId,
                ResolvedTtsId:        resolvedTtsId,
                SoulName:             soulName,
                SoulPersonality:      soulPersonality,
                SoulSystemPrompt:     soulSystemPrompt,
                SoulDescription:      soulDescription,
                SoulStatus:           soulStatus,
                SoulLlmConfig:        soulLlmConfig,
                SoulTtsConfig:        soulTtsConfig,
                SoulAppearance:       soulAppearance,
                SoulResponseBehavior: soulResponseBehavior,
                SoulMemorySettings:   soulMemorySettings,
                SoulAutoPilot:        soulAutoPilot,
                SoulPersonalityConfig: soulPersonalityConfig);

            var cacheOpts = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = ParseTokenTtl,
            };
            await _cache.SetStringAsync(
                $"inkt:import:{token}",
                JsonSerializer.Serialize(context),
                cacheOpts,
                ct).ConfigureAwait(false);

            return new InktFileParseResult(
                ProjectName:    projectName,
                SoulName:       soulName,
                HasGraph:       brainRaw is not null,
                ConnectorCount: connectorCount,
                LlmModelId:     soulLlmModelId,
                LlmProvider:    soulLlmProvider,
                TtsVoiceId:     soulTtsVoiceId,
                TtsProvider:    soulTtsProvider,
                Warnings:       warnings,
                Errors:         [],
                ParseToken:     token);
        }
    }

    public async Task<InktFileFinalizeResult> FinalizeAsync(
        Guid userId,
        InktFileFinalizeCommand command,
        CancellationToken ct = default)
    {
        var raw = await _cache.GetStringAsync($"inkt:import:{command.ParseToken}", ct).ConfigureAwait(false);
        if (raw is null)
            throw new InvalidOperationException("Import session expired or not found. Please upload the file again.");

        var context = JsonSerializer.Deserialize<InktImportContext>(raw)
            ?? throw new InvalidOperationException("Import context is corrupted.");

        if (context.UserId != userId)
            throw new UnauthorizedAccessException("Import session does not belong to this user.");

        // 1. Resolve Soul ID.
        Guid? soulId = command.TargetSoulId;

        if (soulId is null && context.SoulName is not null)
        {
            var llmCatalogId = context.ResolvedLlmId;
            if (llmCatalogId is null)
            {
                var models = await _catalog.GetAvailableLlmModelsAsync(ct: ct).ConfigureAwait(false);
                llmCatalogId = models.FirstOrDefault()?.Id
                    ?? throw new InvalidOperationException("No LLM catalog entries are available on this platform.");
            }

            var card = new AiCard
            {
                Name             = context.SoulName,
                Personality      = context.SoulPersonality      ?? string.Empty,
                SystemPrompt     = context.SoulSystemPrompt     ?? string.Empty,
                Description      = context.SoulDescription      ?? string.Empty,
                Status           = Enum.TryParse<AiCardStatus>(context.SoulStatus, ignoreCase: true, out var st)
                                       ? st : AiCardStatus.Active,
                LlmCatalogId     = llmCatalogId.Value,
                LlmConfig        = context.SoulLlmConfig        ?? "{}",
                TtsCatalogId     = context.ResolvedTtsId,
                TtsConfig        = context.SoulTtsConfig,
                Appearance       = context.SoulAppearance       ?? "{}",
                ResponseBehavior = context.SoulResponseBehavior ?? "{}",
                MemorySettings   = context.SoulMemorySettings   ?? "{}",
                AutoPilot        = context.SoulAutoPilot        ?? "{}",
                PersonalityConfig = PersonalitySettings.Parse(context.SoulPersonalityConfig),
            };

            var created = await _cardService.CreateAsync(userId, card, ct: ct).ConfigureAwait(false);
            soulId = created.Id;
        }

        // 2. Create Project.
        var project = ProjectEntity.Create(userId, context.ProjectName, context.ProjectDesc, soulId);
        if (!string.IsNullOrWhiteSpace(context.ProjectPrompt))
            project.SystemPrompt = context.ProjectPrompt;

        await _projectRepo.CreateAsync(project, ct).ConfigureAwait(false);

        // 3. Import graph if present.
        if (context.BrainJson is not null && _graphImporter is not null)
            await _graphImporter.ImportAsync(project.Id, userId, context.BrainJson, ct).ConfigureAwait(false);

        // 4. Remove parse token.
        await _cache.RemoveAsync($"inkt:import:{command.ParseToken}", ct).ConfigureAwait(false);

        return new InktFileFinalizeResult(project.Id, soulId);
    }

    // ── Helpers ──

    private static string? ReadEntry(ZipArchive zip, string name)
    {
        var entry = zip.GetEntry(name);
        if (entry is null) return null;
        using var stream = entry.Open();
        using var reader = new StreamReader(stream, Encoding.UTF8);
        return reader.ReadToEnd();
    }

    private static string? GetString(JsonElement el, string prop) =>
        el.TryGetProperty(prop, out var v) && v.ValueKind == JsonValueKind.String
            ? v.GetString()
            : null;

    private static string? GetRawJson(JsonElement el, string prop) =>
        el.TryGetProperty(prop, out var v) && v.ValueKind != JsonValueKind.Null
            ? v.GetRawText()
            : null;

    private static InktFileParseResult Error(string message) =>
        new(
            ProjectName:    string.Empty,
            SoulName:       null,
            HasGraph:       false,
            ConnectorCount: 0,
            LlmModelId:     null,
            LlmProvider:    null,
            TtsVoiceId:     null,
            TtsProvider:    null,
            Warnings:       [],
            Errors:         [message],
            ParseToken:     string.Empty);

    // Cached intermediate context stored in Redis between parse and finalize.
    private sealed record InktImportContext(
        Guid    UserId,
        string  ProjectName,
        string? ProjectDesc,
        string? ProjectPrompt,
        string? BrainJson,
        Guid?   ResolvedLlmId,
        Guid?   ResolvedTtsId,
        string? SoulName,
        string? SoulPersonality,
        string? SoulSystemPrompt,
        string? SoulDescription,
        string? SoulStatus,
        string? SoulLlmConfig,
        string? SoulTtsConfig,
        string? SoulAppearance,
        string? SoulResponseBehavior,
        string? SoulMemorySettings,
        string? SoulAutoPilot,
        string? SoulPersonalityConfig);
}
