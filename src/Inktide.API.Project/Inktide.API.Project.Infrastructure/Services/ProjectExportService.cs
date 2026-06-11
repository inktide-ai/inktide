using System.IO.Compression;
using System.Text;
using System.Text.Json;
using Inktide.API.Core.Contracts;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.Domain.Repositories;

namespace Inktide.API.Project.Infrastructure.Services;

internal sealed class ProjectExportService : IProjectExportService
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        WriteIndented = true,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly IProjectRepository _projectRepo;
    private readonly IProjectExportDataQuery _soulQuery;
    private readonly ILocalTtsProviderClassifier _ttsClassifier;

    public ProjectExportService(
        IProjectRepository projectRepo,
        IProjectExportDataQuery soulQuery,
        ILocalTtsProviderClassifier ttsClassifier)
    {
        _projectRepo   = projectRepo   ?? throw new ArgumentNullException(nameof(projectRepo));
        _soulQuery     = soulQuery     ?? throw new ArgumentNullException(nameof(soulQuery));
        _ttsClassifier = ttsClassifier ?? throw new ArgumentNullException(nameof(ttsClassifier));
    }

    public async Task<ProjectExportResult?> ExportAsync(
        Guid userId,
        Guid projectId,
        CancellationToken ct = default)
    {
        var project = await _projectRepo.FindByIdAndUserAsync(projectId, userId, ct).ConfigureAwait(false);
        if (project is null) return null;

        SoulExportSnapshot? soul = null;
        if (project.ActiveSoulId.HasValue)
        {
            soul = await _soulQuery.GetExportSnapshotAsync(userId, project.ActiveSoulId.Value, ct)
                .ConfigureAwait(false);
        }

        var requiredFeatures = new List<string>();
        if (_ttsClassifier.IsLocal(soul?.TtsProvider))
            requiredFeatures.Add($"tts:local:{soul!.TtsProvider!.ToLower()}");

        var metadata = new
        {
            formatVersion          = 1,
            projectVersion         = "1.0",
            minimumPlatformVersion = "1.0",
            exportedAt             = DateTimeOffset.UtcNow,
            sourceVersion          = "1.0",
            requiredFeatures,
        };

        var projectJson = new
        {
            name         = project.Name,
            description  = project.Description,
            status       = project.Status,
            systemPrompt = project.SystemPrompt,
        };

        using var ms = new MemoryStream();
        using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            AddEntry(zip, "metadata.json", metadata);
            AddEntry(zip, "project.json",  projectJson);

            if (soul is not null)
            {
                var soulJson = BuildSoulJson(soul);
                AddRawEntry(zip, "soul.json", soulJson);

                var connectorsJson = soul.Connectors.Select((c, i) => new
                {
                    localId     = c.LocalId,
                    platform    = c.Platform,
                    channelName = c.ChannelName,
                    botUsername = c.BotUsername,
                });
                AddEntry(zip, "connectors.json", connectorsJson);
            }

            AddEntry(zip, "brain.json", new { nodes = Array.Empty<object>(), edges = Array.Empty<object>() });
        }

        var slug = soul?.Slug ?? project.Name.ToLower().Replace(' ', '-');
        return new ProjectExportResult($"{slug}-export.inkt", ms.ToArray());
    }

    private static string BuildSoulJson(SoulExportSnapshot soul)
    {
        // Merge the raw JSONB blobs into a structured soul.json.
        // We write it as a raw JSON string to avoid double-serialization of already-JSON strings.
        var sb = new StringBuilder();
        sb.Append('{');
        AppendStr(sb, "localId",              "soul-main");     sb.Append(',');
        AppendStr(sb, "name",                 soul.Name);       sb.Append(',');
        AppendStr(sb, "slug",                 soul.Slug);       sb.Append(',');
        AppendStr(sb, "description",          soul.Description); sb.Append(',');
        AppendStr(sb, "status",               soul.Status);     sb.Append(',');
        AppendStr(sb, "personality",          soul.Personality); sb.Append(',');
        AppendStr(sb, "systemPrompt",         soul.SystemPrompt); sb.Append(',');
        AppendStr(sb, "llmModelId",           soul.LlmModelId); sb.Append(',');
        AppendStr(sb, "llmProvider",          soul.LlmProvider); sb.Append(',');
        AppendRaw(sb, "llmConfig",            soul.LlmConfigJson); sb.Append(',');
        if (soul.TtsVoiceId is not null)
        {
            AppendStr(sb, "ttsVoiceId",   soul.TtsVoiceId);    sb.Append(',');
            AppendStr(sb, "ttsProvider",  soul.TtsProvider!);   sb.Append(',');
        }
        AppendRaw(sb, "ttsConfig",            soul.TtsConfigJson ?? "{}"); sb.Append(',');
        AppendRaw(sb, "appearance",           soul.AppearanceJson); sb.Append(',');
        AppendRaw(sb, "responseBehavior",     soul.ResponseBehaviorJson); sb.Append(',');
        AppendRaw(sb, "memorySettings",       soul.MemorySettingsJson); sb.Append(',');
        AppendRaw(sb, "autoPilot",            soul.AutoPilotJson); sb.Append(',');
        AppendRaw(sb, "personalityConfig",    soul.PersonalityConfigJson);
        sb.Append('}');
        return sb.ToString();
    }

    private static void AppendStr(StringBuilder sb, string key, string value)
    {
        sb.Append('"');
        sb.Append(JsonEncodedText.Encode(key));
        sb.Append("\":\"");
        sb.Append(JsonEncodedText.Encode(value));
        sb.Append('"');
    }

    private static void AppendRaw(StringBuilder sb, string key, string rawJson)
    {
        sb.Append('"');
        sb.Append(JsonEncodedText.Encode(key));
        sb.Append("\":");
        // Use "{}" as fallback for null/empty raw JSON.
        sb.Append(string.IsNullOrWhiteSpace(rawJson) ? "{}" : rawJson);
    }

    private static void AddEntry<T>(ZipArchive zip, string name, T value)
    {
        var json  = JsonSerializer.Serialize(value, JsonOpts);
        AddRawEntry(zip, name, json);
    }

    private static void AddRawEntry(ZipArchive zip, string name, string json)
    {
        var entry = zip.CreateEntry(name, CompressionLevel.Optimal);
        using var writer = new StreamWriter(entry.Open(), Encoding.UTF8);
        writer.Write(json);
    }
}
