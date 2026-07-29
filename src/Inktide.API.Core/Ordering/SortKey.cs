namespace Inktide.API.Core.Ordering;

/// <summary>
///     Value object for a lexicographically sortable position key (base-62 fractional indexing).
///     Wraps <see cref="FractionalIndexer" /> for type-safe, validated sort key management.
/// </summary>
public sealed record SortKey
{
    private SortKey(string value) => Value = value;

    public string Value { get; }

    /// <summary>Creates from an existing string, validating its format.</summary>
    public static SortKey Create(string value)
    {
        if (!FractionalIndexer.IsValidOrderKey(value))
            throw new ArgumentException($"Invalid sort key: '{value}'.", nameof(value));
        return new SortKey(value);
    }

    public static bool TryCreate(string value, [System.Diagnostics.CodeAnalysis.NotNullWhen(true)] out SortKey? sortKey)
    {
        if (FractionalIndexer.IsValidOrderKey(value))
        {
            sortKey = new SortKey(value);
            return true;
        }
        sortKey = null;
        return false;
    }

    /// <summary>Returns "a0" - the initial key when no items exist.</summary>
    public static SortKey Initial() => new(FractionalIndexer.GenerateKeyBetween(null, null));

    /// <summary>Generates a key after <paramref name="previous" /> (append to end).</summary>
    public static SortKey After(SortKey previous) =>
        new(FractionalIndexer.GenerateKeyBetween(previous.Value, null));

    /// <summary>Generates a key before <paramref name="next" /> (prepend to start).</summary>
    public static SortKey Before(SortKey next) =>
        new(FractionalIndexer.GenerateKeyBetween(null, next.Value));

    /// <summary>Generates a key strictly between two bounds (either may be null for open bound).</summary>
    public static SortKey Between(SortKey? before, SortKey? after) =>
        new(FractionalIndexer.GenerateKeyBetween(before?.Value, after?.Value));

    /// <summary>Generates <paramref name="count" /> evenly-spaced keys between two bounds.</summary>
    public static SortKey[] CreateBatch(SortKey? before, SortKey? after, int count)
    {
        string[] keys = FractionalIndexer.GenerateNKeysBetween(before?.Value, after?.Value, count);
        var result = new SortKey[keys.Length];
        for (int i = 0; i < keys.Length; i++)
            result[i] = new SortKey(keys[i]);
        return result;
    }

    public override string ToString() => Value;

    public static implicit operator string(SortKey key) => key.Value;
}
