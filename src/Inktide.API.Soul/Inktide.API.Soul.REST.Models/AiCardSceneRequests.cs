using Newtonsoft.Json;

namespace Inktide.API.Soul.REST.Models;

public sealed class BeginSceneUploadRequest
{

    private string _fileName = string.Empty;
    private string _contentType = string.Empty;
    private long _sizeBytes;


    [JsonProperty("file_name")]
    public string FileName
    {
        get => _fileName;
        set => _fileName = value;
    }

    [JsonProperty("content_type")]
    public string ContentType
    {
        get => _contentType;
        set => _contentType = value;
    }

    [JsonProperty("size_bytes")]
    public long SizeBytes
    {
        get => _sizeBytes;
        set => _sizeBytes = value;
    }

}

public sealed class CompleteSceneUploadRequest
{

    private string _storageKey = string.Empty;
    private string _fileName = string.Empty;
    private string _contentType = string.Empty;
    private long _sizeBytes;


    [JsonProperty("storage_key")]
    public string StorageKey
    {
        get => _storageKey;
        set => _storageKey = value;
    }

    [JsonProperty("file_name")]
    public string FileName
    {
        get => _fileName;
        set => _fileName = value;
    }

    [JsonProperty("content_type")]
    public string ContentType
    {
        get => _contentType;
        set => _contentType = value;
    }

    [JsonProperty("size_bytes")]
    public long SizeBytes
    {
        get => _sizeBytes;
        set => _sizeBytes = value;
    }

    private string? _tag;

    /// <summary>Optional scene filter tag (max 128 chars).</summary>
    [JsonProperty("tag")]
    public string? Tag
    {
        get => _tag;
        set => _tag = value;
    }

}

public sealed class BeginSceneUploadResponse
{

    private string _uploadUrl = string.Empty;
    private string _storageKey = string.Empty;
    private DateTimeOffset _expiresAt;
    private string _requiredContentType = string.Empty;


    [JsonProperty("upload_url")]
    public string UploadUrl
    {
        get => _uploadUrl;
        set => _uploadUrl = value;
    }

    [JsonProperty("storage_key")]
    public string StorageKey
    {
        get => _storageKey;
        set => _storageKey = value;
    }

    [JsonProperty("expires_at")]
    public DateTimeOffset ExpiresAt
    {
        get => _expiresAt;
        set => _expiresAt = value;
    }

    [JsonProperty("required_content_type")]
    public string RequiredContentType
    {
        get => _requiredContentType;
        set => _requiredContentType = value;
    }

}

public sealed class AiCardSceneResponse
{

    private Guid _id;
    private Guid _aiCardId;
    private string _storageKey = string.Empty;
    private string _publicUrl = string.Empty;
    private string _originalFileName = string.Empty;
    private string _contentType = string.Empty;
    private long _sizeBytes;
    private DateTime _createdAt;


    [JsonProperty("id")]
    public Guid Id
    {
        get => _id;
        set => _id = value;
    }

    [JsonProperty("ai_card_id")]
    public Guid AiCardId
    {
        get => _aiCardId;
        set => _aiCardId = value;
    }

    [JsonProperty("storage_key")]
    public string StorageKey
    {
        get => _storageKey;
        set => _storageKey = value;
    }

    [JsonProperty("public_url")]
    public string PublicUrl
    {
        get => _publicUrl;
        set => _publicUrl = value;
    }

    [JsonProperty("original_file_name")]
    public string OriginalFileName
    {
        get => _originalFileName;
        set => _originalFileName = value;
    }

    [JsonProperty("content_type")]
    public string ContentType
    {
        get => _contentType;
        set => _contentType = value;
    }

    [JsonProperty("size_bytes")]
    public long SizeBytes
    {
        get => _sizeBytes;
        set => _sizeBytes = value;
    }

    [JsonProperty("created_at")]
    public DateTime CreatedAt
    {
        get => _createdAt;
        set => _createdAt = value;
    }

    private string? _tag;

    [JsonProperty("tag")]
    public string? Tag
    {
        get => _tag;
        set => _tag = value;
    }

    private string? _displayName;

    [JsonProperty("display_name")]
    public string? DisplayName
    {
        get => _displayName;
        set => _displayName = value;
    }

    private string? _description;

    [JsonProperty("description")]
    public string? Description
    {
        get => _description;
        set => _description = value;
    }

    private string _sortKey = "a0";

    [JsonProperty("sort_key")]
    public string SortKey
    {
        get => _sortKey;
        set => _sortKey = value;
    }

}

public sealed class ReorderSceneRequest
{
    [JsonProperty("previous_id")] public Guid? PreviousId { get; set; }
    [JsonProperty("next_id")]     public Guid? NextId     { get; set; }
}

public sealed class PutSceneMetadataRequest
{

    private string? _displayName;
    private string? _description;
    private string? _tag;


    [JsonProperty("display_name")]
    public string? DisplayName
    {
        get => _displayName;
        set => _displayName = value;
    }

    [JsonProperty("description")]
    public string? Description
    {
        get => _description;
        set => _description = value;
    }

    /// <summary>Null clears explicit tag (legacy hash on client).</summary>
    [JsonProperty("tag")]
    public string? Tag
    {
        get => _tag;
        set => _tag = value;
    }

}

public sealed class PatchSceneTagRequest
{

    private string? _tag;

    /// <summary>Set to null to clear (legacy hash-based category on client).</summary>
    [JsonProperty("tag")]
    public string? Tag
    {
        get => _tag;
        set => _tag = value;
    }

}

public sealed class AddCustomSceneTagRequest
{

    private string _label = string.Empty;
    private string? _color;

    [JsonProperty("label")]
    public string Label
    {
        get => _label;
        set => _label = value;
    }

    /// <summary>Optional hex color, e.g. "#818cf8". Null → client derives from hash.</summary>
    [JsonProperty("color")]
    public string? Color
    {
        get => _color;
        set => _color = value;
    }

}

public sealed class CustomSceneTagResponse
{

    private string _label = string.Empty;
    private string? _color;

    [JsonProperty("label")]
    public string Label
    {
        get => _label;
        set => _label = value;
    }

    [JsonProperty("color")]
    public string? Color
    {
        get => _color;
        set => _color = value;
    }

}
