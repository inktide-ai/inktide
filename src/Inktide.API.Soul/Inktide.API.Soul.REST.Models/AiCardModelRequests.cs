using Newtonsoft.Json;

namespace Inktide.API.Soul.REST.Models;

public sealed class BeginModelUploadRequest
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

public sealed class CompleteModelUploadRequest
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

}

public sealed class BeginModelUploadResponse
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

    /// <summary>Client must send this exact Content-Type header on PUT.</summary>
    [JsonProperty("required_content_type")]
    public string RequiredContentType
    {
        get => _requiredContentType;
        set => _requiredContentType = value;
    }

}

public sealed class AiCardModelResponse
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

}
