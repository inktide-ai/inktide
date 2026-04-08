using System.Security.Claims;
using Chimera.API.TTS.Application.Synthesis;
using Chimera.API.TTS.REST.Extensions;

using Chimera.API.TTS.Domain.Models;
using Chimera.API.TTS.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging;

namespace Chimera.API.TTS.REST.Controllers;

[ApiController]
[Route("api/v1/tts")]
[Authorize]
public sealed class TtsController : ControllerBase
{
    #region Fields

    private readonly ITtsSynthesisService _synthesisService;
    private readonly ILogger<TtsController> _logger;

    #endregion

    #region Constructors

    public TtsController(
        ITtsSynthesisService synthesisService,
        ILogger<TtsController> logger)
    {
        _synthesisService = synthesisService ?? throw new ArgumentNullException(nameof(synthesisService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #endregion

    #region Public Methods

    /// <summary>
    /// Catalog of registered TTS providers (id, display name, capabilities). Public — no auth required.
    /// </summary>
    [HttpGet("providers")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IReadOnlyCollection<SpeechProviderDescriptor>), StatusCodes.Status200OK)]
    public IActionResult GetProviders()
    {
        return Ok(_synthesisService.GetProviderCatalog());
    }

    /// <summary>
    /// Lists available voice IDs for a provider. Public — no auth required.
    /// Returns 501 if the provider does not support voice listing.
    /// </summary>
    [HttpGet("voices")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IReadOnlyList<SpeechVoice>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public async Task<IActionResult> GetVoicesAsync(
        [FromQuery(Name = "provider_id")] string? providerId,
        CancellationToken cancellationToken)
    {
        var result = await _synthesisService
            .GetVoicesAsync(providerId, cancellationToken)
            .ConfigureAwait(false);

        return result switch
        {
            GetVoicesResult.Ok ok =>
                Ok(ok.Voices),
            GetVoicesResult.ProviderNotFound e =>
                Problem(detail: $"Speech provider '{e.ProviderId}' is not registered.", statusCode: StatusCodes.Status400BadRequest),
            GetVoicesResult.NotSupported e =>
                Problem(detail: $"Provider '{e.ProviderId}' does not support voice listing.", statusCode: StatusCodes.Status501NotImplemented),
            GetVoicesResult.ApiKeyRequired =>
                Problem(detail: "An API key is required to list voices for this provider. Supply it via the X-TTS-Api-Key header.", statusCode: StatusCodes.Status401Unauthorized),
            _ =>
                Problem(statusCode: StatusCodes.Status500InternalServerError),
        };
    }

    /// <summary>
    /// Synthesizes speech. Pass <c>"stream": true</c> for a streaming response.
    /// </summary>
    [HttpPost("synthesize")]
    [EnableRateLimiting(TtsRestApiStartup.SynthesizeRateLimitPolicy)]
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
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> SynthesizeAsync(
        [FromBody] TtsSynthesizeRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var userId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        _logger.LogInformation(
            "TTS synthesize: provider={Provider} voice={Voice} chars={Chars} format={Format} stream={Stream} user={UserId}",
            request.ProviderId ?? "(default)",
            request.VoiceId,
            request.Text?.Length ?? 0,
            request.AudioFormat ?? "mp3",
            request.Stream ?? false,
            userId ?? "(anonymous)");

        var command = new SynthesizeCommand(
            request.ProviderId,
            request.Text ?? string.Empty,
            request.VoiceId ?? string.Empty,
            request.ModelId,
            request.Speed,
            request.Stream ?? false,
            request.AudioFormat,
            userId,
            request.ProviderParams);

        var result = await _synthesisService
            .SynthesizeAsync(command, cancellationToken)
            .ConfigureAwait(false);

        return result switch
        {
            SpeechResult.Ok ok =>
                BuildAudioResponse(ok, command.Stream),
            SpeechResult.ProviderNotFound e =>
                Problem(detail: $"Speech provider '{e.ProviderId}' is not registered.", statusCode: StatusCodes.Status400BadRequest),
            SpeechResult.ValidationFailed e =>
                ValidationProblem(e.Errors.ToModelStateDictionary()),
            SpeechResult.ApiKeyMissing =>
                Problem(detail: "An API key is required for this provider. Supply it via the X-TTS-Api-Key header.", statusCode: StatusCodes.Status401Unauthorized),
            SpeechResult.StreamingNotSupported =>
                Problem(detail: "This provider does not support streaming.", statusCode: StatusCodes.Status501NotImplemented),
            SpeechResult.UpstreamError =>
                Problem(detail: "The TTS provider is temporarily unavailable. Please try again later.", statusCode: StatusCodes.Status502BadGateway),
            _ =>
                Problem(statusCode: StatusCodes.Status500InternalServerError),
        };
    }

    #endregion

    #region Private Methods

    private IActionResult BuildAudioResponse(SpeechResult.Ok result, bool stream)
    {
        if (stream)
        {
            Response.Headers.CacheControl = "no-store, no-transform";
            Response.Headers.Append("X-Accel-Buffering", "no");
            HttpContext.Features.Get<IHttpResponseBodyFeature>()?.DisableBuffering();
        }

        return File(result.Audio, result.ContentType);
    }

    #endregion
}
