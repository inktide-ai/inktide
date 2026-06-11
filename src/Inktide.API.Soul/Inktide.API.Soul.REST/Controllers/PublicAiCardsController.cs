using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Soul.REST.Controllers;

/// <summary>
/// Unauthenticated public profile endpoints — no credentials or private config exposed.
/// </summary>
[ApiController]
[Route("api/v1/souls/public")]
[Produces("application/json")]
[AllowAnonymous]
public sealed class PublicAiCardsController : ControllerBase
{
    private readonly IAiCardService _cards;
    private readonly ISoulActivityFeedService _feed;

    public PublicAiCardsController(IAiCardService cards, ISoulActivityFeedService feed)
    {
        _cards = cards ?? throw new ArgumentNullException(nameof(cards));
        _feed  = feed  ?? throw new ArgumentNullException(nameof(feed));
    }

    /// <summary>Returns public soul profile data by slug (no auth required).</summary>
    [HttpGet("{slug}")]
    [ProducesResponseType(typeof(PublicAiCardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken ct = default)
    {
        var card = await _cards.GetPublicBySlugAsync(slug, ct);
        if (card is null)
            return NotFound(ApiErrorResponse.From("Soul not found.", ErrorCodes.NotFound));

        return Ok(new PublicAiCardResponse
        {
            Id          = card.Id,
            Name        = card.Name,
            Slug        = card.Slug,
            Description = card.Description,
            AvatarUrl   = card.AvatarUrl,
            CoverUrl    = card.CoverUrl,
            Status      = card.Status.ToString().ToLowerInvariant(),
            IsActive    = card.IsActive,
            CreatedAt   = card.CreatedAt,
        });
    }

    /// <summary>Returns the public fan-facing activity feed for a soul by slug (no auth required).</summary>
    [HttpGet("{slug}/activity")]
    [ProducesResponseType(typeof(SoulPublicActivityFeedResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetActivity(
        string slug,
        [FromQuery] int limit = 10,
        [FromQuery] string? cursor = null,
        CancellationToken ct = default)
    {
        var card = await _cards.GetPublicBySlugAsync(slug, ct);
        if (card is null)
            return NotFound(ApiErrorResponse.From("Soul not found.", ErrorCodes.NotFound));

        var page = await _feed.GetPublicPageAsync(card.Id, limit, cursor, ct);

        return Ok(new SoulPublicActivityFeedResponse
        {
            Items = page.Items.Select(i => new SoulPublicActivityFeedItem
            {
                Id           = i.Id,
                EventType    = i.EventType,
                Emoji        = i.Emoji,
                RenderedCopy = i.RenderedCopy,
                OccurredAt   = i.OccurredAt,
            }).ToList(),
            NextCursor = page.NextCursor,
        });
    }
}
