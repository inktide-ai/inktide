using Chimera.API.Soul.Application.Models;
using Chimera.API.Soul.Domain.Entities;
using Chimera.API.Soul.REST.Models;
using Newtonsoft.Json;

namespace Chimera.API.Soul.REST.Converters;

public static class AiCardConverter
{
    #region Public Methods

    public static AiCardResponse ToResponse(AiCard card)
    {
        ArgumentNullException.ThrowIfNull(card);
        return new AiCardResponse
        {
            Id = card.Id,
            Name = card.Name,
            Slug = card.Slug,
            AvatarUrl = card.AvatarUrl,
            Personality = card.Personality,
            SystemPrompt = card.SystemPrompt,
            LlmCatalogId = card.LlmCatalogId,
            LlmConfig = DeserializeJson(card.LlmConfig),
            LlmModel = card.LlmCatalog is not null ? ToLlmResponse(card.LlmCatalog) : null,
            TtsCatalogId = card.TtsCatalogId,
            TtsConfig = DeserializeJson(card.TtsConfig),
            TtsVoice = card.TtsCatalog is not null ? ToTtsResponse(card.TtsCatalog) : null,
            Behavior = DeserializeJson(card.Behavior),
            MemorySettings = DeserializeJson(card.MemorySettings),
            DonkeyEngine = DeserializeJson(card.DonkeyEngine),
            Channels = card.Channels?.Select(ToChannelResponse).ToList(),
            Tools = card.Tools?.Select(ToToolResponse).ToList(),
            IsActive = card.IsActive,
            CreatedAt = card.CreatedAt,
            UpdatedAt = card.UpdatedAt
        };
    }

    public static AiCardListItem ToListItem(AiCard card)
    {
        ArgumentNullException.ThrowIfNull(card);
        return new AiCardListItem
        {
            Id = card.Id,
            Name = card.Name,
            Slug = card.Slug,
            AvatarUrl = card.AvatarUrl,
            Personality = card.Personality,
            LlmModelName = card.LlmCatalog?.DisplayName,
            IsActive = card.IsActive,
            UpdatedAt = card.UpdatedAt
        };
    }

    public static AiCard ToEntity(CreateAiCardRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        return new AiCard
        {
            Name = request.Name,
            Personality = request.Personality ?? string.Empty,
            SystemPrompt = request.SystemPrompt,
            AvatarUrl = request.AvatarUrl,
            LlmCatalogId = request.LlmCatalogId,
            LlmConfig = SerializeJson(request.LlmConfig) ?? "{}",
            TtsCatalogId = request.TtsCatalogId,
            TtsConfig = SerializeJson(request.TtsConfig),
            Behavior = SerializeJson(request.Behavior) ?? "{}",
            MemorySettings = SerializeJson(request.MemorySettings) ?? "{}",
            DonkeyEngine = SerializeJson(request.DonkeyEngine) ?? "{}"
        };
    }

    public static void ApplyUpdate(AiCard existing, UpdateAiCardRequest request)
    {
        ArgumentNullException.ThrowIfNull(existing);
        ArgumentNullException.ThrowIfNull(request);
        if (request.Name is not null) existing.Name = request.Name;
        if (request.Slug is not null) existing.Slug = request.Slug;
        if (request.Personality is not null) existing.Personality = request.Personality;
        if (request.SystemPrompt is not null) existing.SystemPrompt = request.SystemPrompt;
        if (request.AvatarUrl is not null) existing.AvatarUrl = request.AvatarUrl;
        if (request.LlmCatalogId.HasValue) existing.LlmCatalogId = request.LlmCatalogId.Value;
        if (request.LlmConfig is not null) existing.LlmConfig = SerializeJson(request.LlmConfig) ?? "{}";
        if (request.TtsCatalogId.HasValue) existing.TtsCatalogId = request.TtsCatalogId.Value;
        if (request.TtsConfig is not null) existing.TtsConfig = SerializeJson(request.TtsConfig);
        if (request.Behavior is not null) existing.Behavior = SerializeJson(request.Behavior) ?? "{}";
        if (request.MemorySettings is not null) existing.MemorySettings = SerializeJson(request.MemorySettings) ?? "{}";
        if (request.DonkeyEngine is not null) existing.DonkeyEngine = SerializeJson(request.DonkeyEngine) ?? "{}";
        if (request.IsActive.HasValue) existing.IsActive = request.IsActive.Value;
    }

    public static LlmModelResponse ToLlmResponse(LlmCatalogEntry e)
    {
        ArgumentNullException.ThrowIfNull(e);
        return new LlmModelResponse
        {
            Id = e.Id, Provider = e.Provider, ModelId = e.ModelId, DisplayName = e.DisplayName, Tier = e.Tier
        };
    }

    public static TtsVoiceResponse ToTtsResponse(TtsCatalogEntry e)
    {
        ArgumentNullException.ThrowIfNull(e);
        return new TtsVoiceResponse
        {
            Id = e.Id, Provider = e.Provider, VoiceId = e.VoiceId, DisplayName = e.DisplayName,
            Language = e.Language, Gender = e.Gender, SampleUrl = e.SampleUrl,         Tier = e.Tier
        };
    }

    #endregion

    #region Private Methods

    private static ChannelResponse ToChannelResponse(AiCardChannel c) => new()
    {
        Id = c.Id,
        ChannelId = c.ChannelId,
        Platform = c.Platform,
        ChannelName = c.ChannelName,
        BotUsername = c.BotUsername,
        IsActive = c.IsActive,
        ConnectedAt = c.ConnectedAt
    };

    public static ChannelResponse ToChannelResponse(ChannelLinkDto d) =>
        new()
        {
            Id = d.Id,
            ChannelId = d.ChannelId,
            Platform = d.Platform,
            ChannelName = d.ChannelName,
            BotUsername = d.BotUsername,
            IsActive = d.IsActive,
            ConnectedAt = d.ConnectedAt
        };

    private static ToolResponse ToToolResponse(AiCardTool t) => new()
    {
        Id = t.Id, ToolName = t.ToolName, ToolConfig = DeserializeJson(t.ToolConfig), IsEnabled = t.IsEnabled
    };

    private static object? DeserializeJson(string? json) =>
        string.IsNullOrEmpty(json) ? null : JsonConvert.DeserializeObject(json);

    private static string? SerializeJson(object? obj) =>
        obj is null ? null : JsonConvert.SerializeObject(obj);

    #endregion
}
