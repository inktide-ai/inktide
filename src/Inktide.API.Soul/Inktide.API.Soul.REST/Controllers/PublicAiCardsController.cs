using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Soul.REST.Controllers;

/// <summary>
/// Unauthenticated public profile endpoints — no credentials or private config exposed.
/// </summary>
[ApiController]
[Route("api/soul/public")]
[Produces("application/json")]
[AllowAnonymous]
public sealed class PublicAiCardsController : ControllerBase
{
    private readonly IAiCardRepository _repo;
    private readonly ISoulActivityFeedService _feed;

    public PublicAiCardsController(IAiCardRepository repo, ISoulActivityFeedService feed)
    {
        _repo = repo ?? throw new ArgumentNullException(nameof(repo));
        _feed = feed ?? throw new ArgumentNullException(nameof(feed));
    }

    /// <summary>Returns public soul profile data by slug (no auth required).</summary>
    [HttpGet("{slug}")]
    [ProducesResponseType(typeof(PublicAiCardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken ct = default)
    {
        var card = await _repo.GetPublicBySlugAsync(slug, ct);
        if (card is null)
            return NotFound(ApiErrorResponse.From("Soul not found.", ErrorCodes.NotFound));

        var platforms = (card.Channels ?? [])
            .Where(c => c.IsActive)
            .Select(c => c.Platform)
            .Distinct()
            .ToList();

        return Ok(new PublicAiCardResponse
        {
            Id          = card.Id,
            Name        = card.Name,
            Slug        = card.Slug,
            Description = card.Description,
            AvatarUrl   = card.AvatarUrl,
            CoverUrl    = card.CoverUrl,
            Personality = card.Personality,
            Status      = card.Status.ToString().ToLowerInvariant(),
            IsActive    = card.IsActive,
            Platforms   = platforms,
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
        var card = await _repo.GetPublicBySlugAsync(slug, ct);
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
