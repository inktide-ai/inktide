using System.Text.Json;

namespace Chimera.API.TTS.Domain.Models;

public partial class TtsModel
{
    #region Internal Methods

    internal static TtsModel FromResponse(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Null)
        {
            return null;
        }

        string id = default!;
        string model = default!;
        DateTimeOffset created = default;
        string ownedBy = default!;

        foreach (var prop in element.EnumerateObject())
        {
            if (prop.NameEquals("id"u8))
            {
                id = prop.Value.GetString() ?? string.Empty;
                continue;
            }

            if (prop.NameEquals("object"u8))
            {
                if (prop.Value.ValueKind == JsonValueKind.Null)
                {
                    continue;
                }

                model = prop.Value.GetString() ?? "model";
                continue;
            }

            if (prop.NameEquals("created"u8))
            {
                if (prop.Value.ValueKind == JsonValueKind.Null)
                {
                    continue;
                }

                if (prop.Value.ValueKind == JsonValueKind.Number && prop.Value.TryGetInt64(out var unixSeconds))
                {
                    created = DateTimeOffset.FromUnixTimeSeconds(unixSeconds);
                }

                continue;
            }

            if (prop.NameEquals("owned_by"u8))
            {
                ownedBy = prop.Value.GetString() ?? string.Empty;
                continue;
            }
        }

        return new TtsModel(
            id ?? string.Empty,
            string.IsNullOrEmpty(model) ? "model" : model,
            created,
            ownedBy ?? string.Empty);
    }

    #endregion
}
