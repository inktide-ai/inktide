using System.Text.Json.Serialization;

namespace Chimera.API.TTS.Infrastructure.Kokoro;


/// <summary>
/// Kokoro <c>NormalizationOptions</c> JSON body.
/// </summary>
public sealed class KokoroNormalizationOptions
{
    #region Fields

    private bool _normalize = true;

    private bool _unitNormalization = false;

    private bool _urlNormalization = true;

    private bool _emailNormalization = true;

    private bool _optionalPluralizationNormalization = true;

    private bool _phoneNormalization = true;

    private bool _replaceRemainingSymbols = true;

    #endregion

    #region Properties

    [JsonPropertyName("normalize")]
    public bool Normalize
    {
        get => _normalize;
        set => _normalize = value;
    }

    [JsonPropertyName("unit_normalization")]
    public bool UnitNormalization
    {
        get => _unitNormalization;
        set => _unitNormalization = value;
    }

    [JsonPropertyName("url_normalization")]
    public bool UrlNormalization
    {
        get => _urlNormalization;
        set => _urlNormalization = value;
    }

    [JsonPropertyName("email_normalization")]
    public bool EmailNormalization
    {
        get => _emailNormalization;
        set => _emailNormalization = value;
    }

    [JsonPropertyName("optional_pluralization_normalization")]
    public bool OptionalPluralizationNormalization
    {
        get => _optionalPluralizationNormalization;
        set => _optionalPluralizationNormalization = value;
    }

    [JsonPropertyName("phone_normalization")]
    public bool PhoneNormalization
    {
        get => _phoneNormalization;
        set => _phoneNormalization = value;
    }

    [JsonPropertyName("replace_remaining_symbols")]
    public bool ReplaceRemainingSymbols
    {
        get => _replaceRemainingSymbols;
        set => _replaceRemainingSymbols = value;
    }

    #endregion
}
