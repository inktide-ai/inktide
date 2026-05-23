using System.IO.Compression;
using System.Text;
using System.Text.Json;

namespace Inktide.API.Project.Infrastructure.Services;

/// <summary>
/// Extracts and validates the contents of a .inkt ZIP archive.
/// Pure extraction — no I/O beyond the stream, no external dependencies.
/// Throws InvalidOperationException with a user-facing message on any parse failure.
/// </summary>
internal static class InktArchiveParser
{
    private const int CurrentFormatVersion = 1;

    public static InktArchiveData Extract(Stream stream)
    {
        ZipArchive zip;
        try { zip = new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: false); }
        catch { throw new InvalidOperationException("File is not a valid .inkt archive."); }

        using (zip)
        {
            var metaJson = ReadEntry(zip, "metadata.json")
                ?? throw new InvalidOperationException("Missing metadata.json in archive.");

            int formatVersion;
            List<string> requiredFeatures;
            try
            {
                using var metaDoc = JsonDocument.Parse(metaJson);
                var root = metaDoc.RootElement;
                if (!root.TryGetProperty("formatVersion", out var fv) || fv.ValueKind != JsonValueKind.Number)
                    throw new InvalidOperationException("metadata.json is missing formatVersion.");
                formatVersion = fv.GetInt32();
                requiredFeatures = root.TryGetProperty("requiredFeatures", out var rf) && rf.ValueKind == JsonValueKind.Array
                    ? rf.EnumerateArray().Select(x => x.GetString() ?? string.Empty).ToList()
                    : [];
            }
            catch (InvalidOperationException) { throw; }
            catch { throw new InvalidOperationException("metadata.json is corrupted or invalid."); }

            if (formatVersion != CurrentFormatVersion)
                throw new InvalidOperationException(
                    $"Unsupported format version {formatVersion}. This platform supports version {CurrentFormatVersion}.");

            var projectJson = ReadEntry(zip, "project.json")
                ?? throw new InvalidOperationException("Missing project.json in archive.");

            string projectName;
            string? projectDesc = null;
            string? projectPrompt = null;
            try
            {
                using var projDoc = JsonDocument.Parse(projectJson);
                var root = projDoc.RootElement;
                projectName   = GetString(root, "name") ?? string.Empty;
                projectDesc   = GetString(root, "description");
                projectPrompt = GetString(root, "systemPrompt");
            }
            catch (InvalidOperationException) { throw; }
            catch { throw new InvalidOperationException("project.json is corrupted or invalid."); }

            if (string.IsNullOrWhiteSpace(projectName))
                throw new InvalidOperationException("project.json is missing a project name.");

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
                    soulName              = GetString(root, "name");
                    soulPersonality       = GetString(root, "personality");
                    soulSystemPrompt      = GetString(root, "systemPrompt");
                    soulDescription       = GetString(root, "description");
                    soulStatus            = GetString(root, "status");
                    soulLlmModelId        = GetString(root, "llmModelId");
                    soulLlmProvider       = GetString(root, "llmProvider");
                    soulTtsVoiceId        = GetString(root, "ttsVoiceId");
                    soulTtsProvider       = GetString(root, "ttsProvider");
                    soulLlmConfig         = GetRawJson(root, "llmConfig");
                    soulTtsConfig         = GetRawJson(root, "ttsConfig");
                    soulAppearance        = GetRawJson(root, "appearance");
                    soulResponseBehavior  = GetRawJson(root, "responseBehavior");
                    soulMemorySettings    = GetRawJson(root, "memorySettings");
                    soulAutoPilot         = GetRawJson(root, "autoPilot");
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

            return new InktArchiveData(
                FormatVersion:        formatVersion,
                RequiredFeatures:     requiredFeatures,
                ProjectName:          projectName,
                ProjectDesc:          projectDesc,
                ProjectPrompt:        projectPrompt,
                BrainJson:            brainRaw,
                ConnectorCount:       connectorCount,
                SoulName:             soulName,
                SoulPersonality:      soulPersonality,
                SoulSystemPrompt:     soulSystemPrompt,
                SoulDescription:      soulDescription,
                SoulStatus:           soulStatus,
                SoulLlmModelId:       soulLlmModelId,
                SoulLlmProvider:      soulLlmProvider,
                SoulTtsVoiceId:       soulTtsVoiceId,
                SoulTtsProvider:      soulTtsProvider,
                SoulLlmConfig:        soulLlmConfig,
                SoulTtsConfig:        soulTtsConfig,
                SoulAppearance:       soulAppearance,
                SoulResponseBehavior: soulResponseBehavior,
                SoulMemorySettings:   soulMemorySettings,
                SoulAutoPilot:        soulAutoPilot,
                SoulPersonalityConfig: soulPersonalityConfig);
        }
    }

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
}

internal sealed record InktArchiveData(
    int                   FormatVersion,
    IReadOnlyList<string> RequiredFeatures,
    string                ProjectName,
    string?               ProjectDesc,
    string?               ProjectPrompt,
    string?               BrainJson,
    int                   ConnectorCount,
    string?               SoulName,
    string?               SoulPersonality,
    string?               SoulSystemPrompt,
    string?               SoulDescription,
    string?               SoulStatus,
    string?               SoulLlmModelId,
    string?               SoulLlmProvider,
    string?               SoulTtsVoiceId,
    string?               SoulTtsProvider,
    string?               SoulLlmConfig,
    string?               SoulTtsConfig,
    string?               SoulAppearance,
    string?               SoulResponseBehavior,
    string?               SoulMemorySettings,
    string?               SoulAutoPilot,
    string?               SoulPersonalityConfig);
