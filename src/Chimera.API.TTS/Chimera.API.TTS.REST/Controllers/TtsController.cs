using Chimera.API.Domain.Models;
using Chimera.API.TTS.Core;
using Chimera.API.TTS.Core.Configuration;
using Chimera.API.TTS.Domain.Models;
using Chimera.API.TTS.REST.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Chimera.API.TTS.REST.Controllers;

/// <summary>
/// TTS: принимает JSON, проксирует в локальный Kokoro (OpenAI-совместимый <c>/v1/audio/speech</c>), отдаёт аудио-поток.
/// </summary>
[ApiController]
[Route("api/tts")]
public sealed class TtsController : ControllerBase
{
    #region Constants

    private const string TtsApiKeyHeader = "X-TTS-Api-Key";

    #endregion

    #region Fields

    private readonly ISpeechProviderRegistry _speechProviderRegistry;
    private readonly IOptions<TtsProviderOptions> _ttsOptions;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TtsController> _logger;

    #endregion

    #region Constructors

    public TtsController(
        ISpeechProviderRegistry speechProviderRegistry,
        IOptions<TtsProviderOptions> ttsOptions,
        IConfiguration configuration,
        ILogger<TtsController> logger)
    {
        _speechProviderRegistry = speechProviderRegistry ?? throw new ArgumentNullException(nameof(speechProviderRegistry));
        _ttsOptions = ttsOptions ?? throw new ArgumentNullException(nameof(ttsOptions));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #endregion

    #region Public Methods

    /// <summary>
    /// Supported synthesized audio formats (id, MIME type, file extension) — for client discovery (SpeechKit-style catalog).
    /// </summary>
    [HttpGet("audio-formats")]
    [ProducesResponseType(typeof(IReadOnlyList<SpeechAudioFormatInfo>), StatusCodes.Status200OK)]
    public IActionResult GetAudioFormats()
    {
        return Ok(SpeechAudioFormatCatalog.All);
    }

    /// <summary>
    /// Catalog of registered TTS providers (id, display name, capabilities).
    /// </summary>
    [HttpGet("providers")]
    [ProducesResponseType(typeof(IReadOnlyCollection<SpeechProviderDescriptor>), StatusCodes.Status200OK)]
    public IActionResult GetProviders()
    {
        var list = _speechProviderRegistry.Descriptors.Values
            .OrderBy(d => d.Id, StringComparer.Ordinal)
            .ToList();

        return Ok(list);
    }

    /// <summary>
    /// Синтез речи. Для потокового ответа (как Python <c>with_streaming_response</c>) передайте <c>"stream": true</c>.
    /// </summary>
    [HttpPost("synthesize")]
    [Produces(
        "audio/mpeg",
        "audio/wav",
        "audio/flac",
        "audio/ogg",
        "audio/opus",
        "audio/webm",
        "audio/pcm",
        "audio/aac")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> SynthesizeAsync(
        [FromBody] TtsSynthesizeRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        _logger.LogDebug("TTS synthesize: provider={Provider}, stream={Stream}", request.ProviderId, request.Stream);

        ISpeechProvider provider;
        try
        {
            provider = _speechProviderRegistry.Resolve(_ttsOptions, request.ProviderId);
        }
        catch (KeyNotFoundException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }

        IActionResult? credentialProblem = TryBuildProviderOptions(provider, out var providerConfig);
        if (credentialProblem is not null)
        {
            return credentialProblem;
        }

        var validation = provider.Validate(providerConfig!);
        if (!validation.IsValid)
        {
            return BadRequest(new { errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });
        }

        if (!SpeechAudioFormatCatalog.TryResolve(request.AudioFormat, out var formatInfo, out var formatError))
        {
            return BadRequest(new { error = formatError });
        }

        var useStream = request.Stream == true;
        if (useStream && !provider.Capabilities.SupportsStreaming)
        {
            return Problem(
                detail: $"Speech provider '{provider.Id}' does not support streaming synthesis (stream: true).",
                statusCode: StatusCodes.Status501NotImplemented);
        }

        var speechRequest = new SpeechOptions
        {
            Text = request.Text,
            Voice = request.VoiceId.Trim(),
            Model = string.IsNullOrWhiteSpace(request.ModelId) ? null : request.ModelId.Trim(),
            Speed = request.Speed ?? 1f,
            AudioFormat = formatInfo.Id,
            Stream = useStream,
        };

        Stream stream;
        try
        {
            stream = await provider
                .SynthesizeAsync(providerConfig!, speechRequest, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (HttpRequestException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status502BadGateway);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (NotImplementedException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status501NotImplemented);
        }

        if (useStream)
        {
            Response.Headers.CacheControl = "no-store, no-transform";
            Response.Headers.Append("X-Accel-Buffering", "no");
            HttpContext.Features.Get<IHttpResponseBodyFeature>()?.DisableBuffering();
        }

        var fileName = $"tts-{Guid.NewGuid():N}.{formatInfo.FileExtension}";
        return File(
            stream,
            formatInfo.MimeType,
            fileDownloadName: useStream ? null : fileName,
            enableRangeProcessing: false);
    }

    #endregion

    #region Private Methods

    private IActionResult? TryBuildProviderOptions(ISpeechProvider provider, out ProviderOptions providerConfig)
    {
        providerConfig = new ProviderOptions
        {
            ProviderId = provider.Id,
        };

        if (!provider.Capabilities.RequiresApiKey)
        {
            return null;
        }

        var apiKey = Request.Headers[TtsApiKeyHeader].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            apiKey = _configuration[$"TtsProviders:{provider.Id}:ApiKey"];
        }

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return Problem(
                detail:
                $"Speech provider '{provider.Id}' requires an API key (header {TtsApiKeyHeader} or configuration TtsProviders:{provider.Id}:ApiKey).",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        providerConfig.ApiKey = apiKey;
        return null;
    }

    #endregion
}
