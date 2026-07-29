namespace Inktide.API.Core.Contracts;

/// <summary>
/// Cross-context command for creating a Soul during project import.
/// The JSON-string fields (LlmConfig, Appearance, etc.) reflect Soul's actual JSONB storage format -
/// Soul.Domain has no typed value objects for these blobs, so strings are the correct representation.
/// PersonalityConfigJson is deserialized by Soul.Infrastructure via PersonalitySettings.Parse().
/// </summary>
public sealed record ImportSoulCommand(
    string  Name,
    string  Personality,
    string  SystemPrompt,
    string  Description,
    string  Status,
    Guid    LlmCatalogId,
    string  LlmConfig,
    Guid?   TtsCatalogId,
    string? TtsConfig,
    string  Appearance,
    string  ResponseBehavior,
    string  MemorySettings,
    string  AutoPilot,
    string? PersonalityConfigJson);
