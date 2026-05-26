using System.Collections.ObjectModel;
using System.Text.Json;

namespace Inktide.API.TTS.Domain.Models;

public sealed class SpeechModelCollection : ReadOnlyCollection<SpeechModel>
{

    private readonly string _object;


    internal SpeechModelCollection(
        string @object,
        IList<SpeechModel> items)
        : base(items ?? new List<SpeechModel>())
    {
        _object = @object;
    }


    public string Object => _object;


    /// <summary>
    /// Parses an OpenAI-compatible <c>/v1/models</c> JSON payload (root object with <c>data</c> array, or a bare array).
    /// </summary>
    internal static SpeechModelCollection FromResponse(JsonElement root)
    {
        var objectType = "list";
        if (root.ValueKind == JsonValueKind.Object &&
            root.TryGetProperty("object", out var objectProp) &&
            objectProp.ValueKind == JsonValueKind.String)
        {
            objectType = objectProp.GetString() ?? "list";
        }

        JsonElement array;
        if (root.ValueKind == JsonValueKind.Array)
        {
            array = root;
        }
        else if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("data", out var data))
        {
            array = data;
        }
        else
        {
            return new SpeechModelCollection(objectType, new List<SpeechModel>());
        }

        if (array.ValueKind != JsonValueKind.Array)
        {
            return new SpeechModelCollection(objectType, new List<SpeechModel>());
        }

        var list = new List<SpeechModel>();
        foreach (var el in array.EnumerateArray())
        {
            var model = ParseOne(el);
            if (model is not null)
            {
                list.Add(model);
            }
        }

        return new SpeechModelCollection(objectType, list);
    }

    private static SpeechModel? ParseOne(JsonElement element)
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

}
