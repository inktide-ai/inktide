namespace Inktide.API.Soul.Domain.Entities;

/// <summary>
/// User-defined scene filter label for an <see cref="AiCard"/> (pill before any scene uses it).
/// Uniqueness is enforced on <see cref="LabelNormalized"/> per card.
/// </summary>
public sealed class AiCardCustomSceneTag
{

    private AiCardCustomSceneTag() { }


    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public Guid AiCardId { get; private set; }

    /// <summary>Display text as entered by the user.</summary>
    public string Label { get; private set; } = string.Empty;

    /// <summary>Lowercase trimmed form for uniqueness checks.</summary>
    public string LabelNormalized { get; private set; } = string.Empty;

    /// <summary>Optional user-chosen hex color, e.g. "#818cf8". Null → client derives from hash.</summary>
    public string? Color { get; private set; }

    public DateTime CreatedAt { get; private set; }

    public AiCard? AiCard { get; private set; }


    public static AiCardCustomSceneTag Create(Guid userId, Guid aiCardId, string label, DateTime createdAt, string? color = null)
    {
        if (userId == Guid.Empty) throw new ArgumentException("userId must not be empty.", nameof(userId));
        if (aiCardId == Guid.Empty) throw new ArgumentException("aiCardId must not be empty.", nameof(aiCardId));
        if (string.IsNullOrWhiteSpace(label)) throw new ArgumentException("label is required.", nameof(label));

        var trimmed = label.Trim();
        if (trimmed.Length > 128)
            throw new ArgumentOutOfRangeException(nameof(label), "label must be at most 128 characters.");

        return new AiCardCustomSceneTag
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AiCardId = aiCardId,
            Label = trimmed,
            LabelNormalized = trimmed.ToLowerInvariant(),
            Color = string.IsNullOrWhiteSpace(color) ? null : color.Trim().ToLowerInvariant(),
            CreatedAt = createdAt,
        };
    }

}
