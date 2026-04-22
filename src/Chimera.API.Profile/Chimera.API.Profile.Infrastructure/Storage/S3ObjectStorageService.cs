using System.Net;
using Amazon.S3;
using Amazon.S3.Model;
using Chimera.API.Profile.Application.Interfaces;
using Chimera.API.Profile.Infrastructure.Settings;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Profile.Infrastructure.Storage;

public sealed class S3ObjectStorageService : IObjectStorageService
{

    private readonly IAmazonS3 _client;
    private readonly S3Settings _settings;
    private readonly ILogger<S3ObjectStorageService> _logger;


    public S3ObjectStorageService(
        IAmazonS3 client,
        S3Settings settings,
        ILogger<S3ObjectStorageService> logger)
    {
        _client = client ?? throw new ArgumentNullException(nameof(client));
        _settings = settings ?? throw new ArgumentNullException(nameof(settings));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }


    public bool IsEnabled => true;

    public string? DefaultBucket => _settings.DefaultBucket;


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

    public string? GetPreSignedPutUrl(string objectKey, string contentType, TimeSpan expires)
    {
        var bucket = _settings.DefaultBucket;
        var ct = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType;
        var request = new GetPreSignedUrlRequest
        {
            BucketName = bucket,
            Key = objectKey,
            Verb = HttpVerb.PUT,
            Expires = DateTime.UtcNow.Add(expires),
            ContentType = ct
        };

        var url = _client.GetPreSignedURL(request);

        // AWS SDK ignores UseHttp when generating presigned URLs and always produces https://.
        // Force the scheme to match ServiceUrl so local MinIO (http) works in browsers.
        if (!string.IsNullOrWhiteSpace(url))
        {
            var serviceUri = new Uri(_settings.ServiceUrl);
            if (serviceUri.Scheme == Uri.UriSchemeHttp)
                url = url.Replace("https://", "http://", StringComparison.OrdinalIgnoreCase);

            // When ServiceUrl is an internal address (e.g. http://minio:9000 inside Docker)
            // but the browser needs a public address (e.g. http://localhost:9000),
            // rewrite the origin in the presigned URL.
            if (!string.IsNullOrWhiteSpace(_settings.PublicBaseUrl))
            {
                var internalOrigin = serviceUri.GetLeftPart(UriPartial.Authority);
                var publicOrigin = new Uri(_settings.PublicBaseUrl).GetLeftPart(UriPartial.Authority);
                if (!string.Equals(internalOrigin, publicOrigin, StringComparison.OrdinalIgnoreCase))
                    url = url.Replace(internalOrigin, publicOrigin, StringComparison.OrdinalIgnoreCase);
            }
        }

        return url;
    }

    public async Task<ObjectStorageObjectInfo?> GetObjectInfoAsync(string objectKey, CancellationToken ct = default)
    {
        try
        {
            var response = await _client
                .GetObjectMetadataAsync(_settings.DefaultBucket, objectKey, ct)
                .ConfigureAwait(false);

            _logger.LogDebug("S3 HeadObject key={Key} size={Size} ct={ContentType}",
                objectKey, response.ContentLength, response.Headers.ContentType);

            return new ObjectStorageObjectInfo(
                response.ContentLength,
                response.Headers.ContentType);
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            _logger.LogWarning("S3 HeadObject NOT FOUND bucket={Bucket} key={Key}", _settings.DefaultBucket, objectKey);
            return null;
        }
        catch (AmazonS3Exception ex)
        {
            _logger.LogError(ex, "S3 HeadObject FAILED bucket={Bucket} key={Key} status={Status} code={Code}",
                _settings.DefaultBucket, objectKey, ex.StatusCode, ex.ErrorCode);
            return null;
        }
    }

}
