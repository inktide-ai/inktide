using System.Collections.ObjectModel;
using System.Text.Json;

namespace Chimera.API.TTS.Domain.Models;

public class SpeechModelCollection : ReadOnlyCollection<SpeechModel>
{
    #region Fields

    private string _object = "list";

    #endregion

    #region Constructors

    internal SpeechModelCollection(
        string @object,
        IList<SpeechModel> items)
        : base(items ?? new List<SpeechModel>())
    {
        _object = @object;
    }

    #endregion

    #region Properties

    public string Object => _object;

    #endregion

    #region Internal Methods

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
            var model = SpeechModel.FromResponse(el);
            if (model is not null)
            {
                list.Add(model);
            }
        }

        return new SpeechModelCollection(objectType, list);
    }

    #endregion
}
