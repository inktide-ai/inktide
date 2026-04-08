using System.Text.Json;

namespace Chimera.API.TTS.Domain.Models;

public class SpeechModel
{
    #region Fields

    private string _id = string.Empty;
    private string _model = string.Empty;
    private DateTimeOffset _created;
    private string _ownedBy = string.Empty;

    #endregion

    #region Properties

    public string Id => _id;
    public string Model => _model;
    public DateTimeOffset Created => _created;
    public string OwnedBy => _ownedBy;

    #endregion

    #region Constructors

    internal SpeechModel(string id, string model, DateTimeOffset created, string ownedBy)
    {
        _id = id;
        _model = model;
        _created = created;
        _ownedBy = ownedBy;
    }

    #endregion

    #region Internal Methods

    internal static SpeechModel FromResponse(JsonElement element)
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

        return new SpeechModel(
            id ?? string.Empty,
            string.IsNullOrEmpty(model) ? "model" : model,
            created,
            ownedBy ?? string.Empty);
    }

    #endregion
}
