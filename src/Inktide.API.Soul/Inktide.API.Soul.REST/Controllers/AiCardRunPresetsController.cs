using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Soul.REST.Controllers;

/// <summary>
/// Runtime configuration presets (Scenes) for an AI card.
/// Presets are an overlay layer — they override LLM model, temperature, emotion profile, or voice
/// at runtime without mutating the base card config. At most one preset is active per card.
/// </summary>
[ApiController]
[Route("api/soul/cards/{cardId:guid}/run-presets")]
[Produces("application/json")]
[Authorize]
public sealed class AiCardRunPresetsController : ApiController
{

    private readonly IAiCardRunPresetService _presets;


    public AiCardRunPresetsController(IAiCardRunPresetService presets)
    {
        _presets = presets ?? throw new ArgumentNullException(nameof(presets));
    }


    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<RunPresetResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> List(Guid cardId, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var list = await _presets.ListAsync(userId, cardId, ct).ConfigureAwait(false);
        if (list is null) return NotFound();

        return Ok(list.Select(ToResponse).ToList());
    }

    [HttpPost]
    [ProducesResponseType(typeof(RunPresetResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(Guid cardId, [FromBody] CreateRunPresetRequest? body, CancellationToken ct)
    {
        if (body is null) return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));
        if (string.IsNullOrWhiteSpace(body.Name))
            return BadRequest(ApiErrorResponse.From("name is required.", ErrorCodes.ValidationError));
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var preset = await _presets.CreateAsync(
            userId, cardId,
            body.Name, body.Description, body.Icon,
            body.OverrideLlmModelId, body.OverrideTemperature,
            body.OverrideEmotionPresetId, body.OverrideVoiceProfileId,
            ct).ConfigureAwait(false);

        if (preset is null) return NotFound();

        return CreatedAtAction(nameof(List), new { cardId }, ToResponse(preset));
    }

    [HttpPut("{presetId:guid}")]
    [ProducesResponseType(typeof(RunPresetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid cardId, Guid presetId, [FromBody] UpdateRunPresetRequest? body, CancellationToken ct)
    {
        if (body is null) return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));
        if (string.IsNullOrWhiteSpace(body.Name))
            return BadRequest(ApiErrorResponse.From("name is required.", ErrorCodes.ValidationError));
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var preset = await _presets.UpdateAsync(
            userId, cardId, presetId,
            body.Name, body.Description, body.Icon,
            body.OverrideLlmModelId, body.OverrideTemperature,
            body.OverrideEmotionPresetId, body.OverrideVoiceProfileId,
            ct).ConfigureAwait(false);

        if (preset is null) return NotFound();
        return Ok(ToResponse(preset));
    }

    [HttpDelete("{presetId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid cardId, Guid presetId, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var found = await _presets.DeleteAsync(userId, cardId, presetId, ct).ConfigureAwait(false);
        return found ? NoContent() : NotFound();
    }

    /// <summary>Activates this preset and deactivates all others for the card.</summary>
    [HttpPost("{presetId:guid}/activate")]
    [ProducesResponseType(typeof(RunPresetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Activate(Guid cardId, Guid presetId, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var preset = await _presets.ActivateAsync(userId, cardId, presetId, ct).ConfigureAwait(false);
        if (preset is null) return NotFound();
        return Ok(ToResponse(preset));
    }

    /// <summary>Deactivates the currently active preset, reverting the card to its base defaults.</summary>
    [HttpDelete("active")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeactivateActive(Guid cardId, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        await _presets.DeactivateActiveAsync(userId, cardId, ct).ConfigureAwait(false);
        return NoContent();
    }

    /// <summary>Move a preset to a new position. previousId=null → beginning; nextId=null → end.</summary>
    [HttpPut("{presetId:guid}/position")]
    [ProducesResponseType(typeof(RunPresetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reorder(
        Guid cardId, Guid presetId, [FromBody] ReorderPresetRequest? body, CancellationToken ct)
    {
        if (body is null) return BadRequest(ApiErrorResponse.From("Request body is required.", ErrorCodes.ValidationError));
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var preset = await _presets.ReorderAsync(userId, cardId, presetId, body.PreviousId, body.NextId, ct).ConfigureAwait(false);
        return preset is null ? NotFound() : Ok(ToResponse(preset));
    }


    private static RunPresetResponse ToResponse(AiCardRunPreset p) => new()
    {
        Id                    = p.Id,
        AiCardId              = p.AiCardId,
        Name                  = p.Name,
        Description           = p.Description,
        Icon                  = p.Icon,
        IsActive              = p.IsActive,
        SortKey               = p.SortKey,
        OverrideLlmModelId    = p.OverrideLlmModelId,
        OverrideTemperature   = p.OverrideTemperature,
        OverrideEmotionPresetId = p.OverrideEmotionPresetId,
        OverrideVoiceProfileId  = p.OverrideVoiceProfileId,
        CreatedAt             = p.CreatedAt,
        UpdatedAt             = p.UpdatedAt,
    };

}
