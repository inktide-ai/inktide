using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.REST.Models;

namespace Inktide.API.Soul.REST.Mappers;

/// <summary>
/// Maps catalog domain entities to REST response models.
/// SRP: one reason to change — catalog read representation (LLM and TTS).
/// OCP: adding an image-generation catalog only requires adding ToImageGenResponse here.
/// </summary>
public static class CatalogResponseMapper
{
    public static LlmModelResponse ToLlmResponse(LlmCatalogEntry entry)
    {
        ArgumentNullException.ThrowIfNull(entry);
        return new LlmModelResponse
        {
            Id          = entry.Id,
            Provider    = entry.Provider,
            ModelId     = entry.ModelId,
            DisplayName = entry.DisplayName,
            Tier        = entry.Tier,
        };
    }

    public static TtsVoiceResponse ToTtsResponse(TtsCatalogEntry entry)
    {
        ArgumentNullException.ThrowIfNull(entry);
        return new TtsVoiceResponse
        {
            Id          = entry.Id,
            Provider    = entry.Provider,
            VoiceId     = entry.VoiceId,
            DisplayName = entry.DisplayName,
            Language    = entry.Language,
            Gender      = entry.Gender,
            SampleUrl   = entry.SampleUrl,
            Tier        = entry.Tier,
        };
    }
}
