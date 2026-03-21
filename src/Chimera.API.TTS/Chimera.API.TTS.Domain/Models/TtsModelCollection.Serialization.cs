using System.Text.Json;

namespace Chimera.API.TTS.Domain.Models;

public partial class TtsModelCollection
{
    #region Internal Methods

    /// <summary>
    /// Parses an OpenAI-compatible <c>/v1/models</c> JSON payload (root object with <c>data</c> array, or a bare array).
    /// </summary>
    internal static TtsModelCollection FromResponse(JsonElement root)
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
            return new TtsModelCollection(objectType, new List<TtsModel>());
        }

        if (array.ValueKind != JsonValueKind.Array)
        {
            return new TtsModelCollection(objectType, new List<TtsModel>());
        }

        var list = new List<TtsModel>();
        foreach (var el in array.EnumerateArray())
        {
            var model = TtsModel.FromResponse(el);
            if (model is not null)
            {
                list.Add(model);
            }
        }

        return new TtsModelCollection(objectType, list);
    }

    #endregion
}
