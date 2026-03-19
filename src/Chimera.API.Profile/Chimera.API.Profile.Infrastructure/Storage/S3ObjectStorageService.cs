using Amazon.S3;
using Amazon.S3.Model;
using Chimera.API.Profile.Application.Interfaces;
using Chimera.API.Profile.Infrastructure.Settings;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Profile.Infrastructure.Storage;

public sealed class S3ObjectStorageService : IObjectStorageService
{
    #region Fields

    private readonly IAmazonS3 _client;
    private readonly S3Settings _settings;
    private readonly ILogger<S3ObjectStorageService> _logger;

    #endregion

    #region Constructors

    public S3ObjectStorageService(
        IAmazonS3 client,
        S3Settings settings,
        ILogger<S3ObjectStorageService> logger)
    {
        _client = client ?? throw new ArgumentNullException(nameof(client));
        _settings = settings ?? throw new ArgumentNullException(nameof(settings));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #endregion

    #region Properties

    public bool IsEnabled => true;

    public string? DefaultBucket => _settings.DefaultBucket;

    #endregion

    #region Public Methods

    public async Task PutObjectAsync(string objectKey, Stream content, string? contentType, CancellationToken ct = default)
    {
        var bucket = _settings.DefaultBucket;
        var request = new PutObjectRequest
        {
            BucketName = bucket,
            Key = objectKey,
            InputStream = content,
            AutoCloseStream = false,
            ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType
        };

        await _client.PutObjectAsync(request, ct).ConfigureAwait(false);
        _logger.LogDebug("S3 PutObject bucket={Bucket} key={Key}", bucket, objectKey);
    }

    public async Task<Stream> GetObjectAsync(string objectKey, CancellationToken ct = default)
    {
        using var response = await _client
            .GetObjectAsync(_settings.DefaultBucket, objectKey, ct)
            .ConfigureAwait(false);
        var ms = new MemoryStream();
        await response.ResponseStream.CopyToAsync(ms, ct).ConfigureAwait(false);
        ms.Position = 0;
        return ms;
    }

    public async Task DeleteObjectAsync(string objectKey, CancellationToken ct = default)
    {
        await _client.DeleteObjectAsync(_settings.DefaultBucket, objectKey, ct).ConfigureAwait(false);
        _logger.LogDebug("S3 DeleteObject key={Key}", objectKey);
    }

    public async Task<IReadOnlyList<ObjectStorageListItem>> ListObjectsAsync(string? prefix, CancellationToken ct = default)
    {
        var list = new List<ObjectStorageListItem>();
        string? token = null;
        do
        {
            var request = new ListObjectsV2Request
            {
                BucketName = _settings.DefaultBucket,
                Prefix = prefix,
                ContinuationToken = token
            };
            var response = await _client.ListObjectsV2Async(request, ct).ConfigureAwait(false);
            
            foreach (var o in response.S3Objects)
            {
                list.Add(new ObjectStorageListItem(o.Key, o.Size, o.LastModified));
            }

            token = response.IsTruncated == true ? response.NextContinuationToken : null;
        } while (token != null);

        return list;
    }

    #endregion
}
