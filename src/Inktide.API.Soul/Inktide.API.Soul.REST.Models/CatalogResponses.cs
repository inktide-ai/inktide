using Newtonsoft.Json;

namespace Inktide.API.Soul.REST.Models;

public sealed class LlmModelResponse
{

    private Guid _id;
    private string _provider = string.Empty;
    private string _modelId = string.Empty;
    private string _displayName = string.Empty;
    private string _tier = string.Empty;


    [JsonProperty("id")]
    public Guid Id
    {
        get => _id;
        set => _id = value;
    }

    [JsonProperty("provider")]
    public string Provider
    {
        get => _provider;
        set => _provider = value;
    }

    [JsonProperty("model_id")]
    public string ModelId
    {
        get => _modelId;
        set => _modelId = value;
    }

    [JsonProperty("display_name")]
    public string DisplayName
    {
        get => _displayName;
        set => _displayName = value;
    }

    [JsonProperty("tier")]
    public string Tier
    {
        get => _tier;
        set => _tier = value;
    }

}

public sealed class TtsVoiceResponse
{

    private Guid _id;
    private string _provider = string.Empty;
    private string _voiceId = string.Empty;
    private string _displayName = string.Empty;
    private string _language = string.Empty;
    private string? _gender;
    private string? _sampleUrl;
    private string _tier = string.Empty;


    [JsonProperty("id")]
    public Guid Id
    {
        get => _id;
        set => _id = value;
    }

    [JsonProperty("provider")]
    public string Provider
    {
        get => _provider;
        set => _provider = value;
    }

    [JsonProperty("voice_id")]
    public string VoiceId
    {
        get => _voiceId;
        set => _voiceId = value;
    }

    [JsonProperty("display_name")]
    public string DisplayName
    {
        get => _displayName;
        set => _displayName = value;
    }

    [JsonProperty("language")]
    public string Language
    {
        get => _language;
        set => _language = value;
    }

    [JsonProperty("gender")]
    public string? Gender
    {
        get => _gender;
        set => _gender = value;
    }

    [JsonProperty("sample_url")]
    public string? SampleUrl
    {
        get => _sampleUrl;
        set => _sampleUrl = value;
    }

    [JsonProperty("tier")]
    public string Tier
    {
        get => _tier;
        set => _tier = value;
    }

}
