using System.Runtime.CompilerServices;
using System.Text;

namespace Inktide.API.Synapse.Infrastructure.Llm;

/// <summary>
/// Turns a raw LLM token stream into TTS-ready sentence chunks.
/// Port of fast-api/ai-worker/llm-worker/app/llm/sentence_accumulator.py.
/// </summary>
/// <remarks>
/// <b>Narration</b> - splits on sentence-ending punctuation (.!?) with a lookahead buffer
/// so each chunk is a complete sentence. Keeps latency low by yielding as soon as
/// a sentence boundary is confirmed. The first chunk may also end at a clause boundary
/// (, ; : or a dash): audio starts only once the first chunk is synthesized, and an
/// opener like "Oh, benchmark," is voiced far sooner than a whole long sentence.
///
/// <b>Chat</b> - buffers the entire LLM response and emits it as one chunk.
/// Preserves semantic coherence for short conversational replies where latency matters
/// less than delivering the full thought at once.
/// </remarks>
internal static class SentenceAccumulator
{

    private const int MinSentenceLength = 10;

    // Shorter first clauses ("Oh,") would be voiced as a lone word with an odd cadence.
    private const int MinFirstClauseLength = 12;

    private static readonly HashSet<string> Abbreviations = new(StringComparer.OrdinalIgnoreCase)
    {
        "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "vs", "etc", "approx",
        "dept", "est", "fig", "inc", "ltd", "no", "vol",
        "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec",
    };


    public static async IAsyncEnumerable<string> AccumulateAsync(
        IAsyncEnumerable<string> tokens,
        ChunkingMode mode = ChunkingMode.Narration,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        if (mode == ChunkingMode.Chat)
        {
            var sb = new StringBuilder();
            await foreach (var tok in tokens.WithCancellation(ct))
                sb.Append(tok);
            var full = sb.ToString().Trim();
            if (full.Length > 0) yield return full;
            yield break;
        }

        // Narration: yield one sentence at a time.
        var buffer = new StringBuilder();
        var first  = true;

        await foreach (var tok in tokens.WithCancellation(ct))
        {
            buffer.Append(tok);

            if (first && TryExtractFirstClause(buffer, out var clause))
            {
                first = false;
                yield return clause;
            }

            while (TryExtractSentence(buffer, out var sentence))
            {
                first = false;
                yield return sentence;
            }
        }

        // Flush any remaining text that didn't end with punctuation.
        var tail = buffer.ToString().Trim();
        if (tail.Length > 0)
            yield return tail;
    }


    private static bool TryExtractSentence(StringBuilder buffer, out string sentence)
    {
        var text = buffer.ToString();

        for (var i = MinSentenceLength; i < text.Length; i++)
        {
            var ch = text[i];
            if (ch != '.' && ch != '!' && ch != '?')
                continue;

            // Skip ellipsis / repeated punctuation (e.g. "..." or "?!")
            if (i + 1 < text.Length && (text[i + 1] == '.' || text[i + 1] == '!' || text[i + 1] == '?'))
                continue;

            // The character after punctuation must be whitespace or end of buffer -
            // otherwise this is mid-word (e.g. a URL or decimal number).
            if (i + 1 < text.Length && !char.IsWhiteSpace(text[i + 1]))
                continue;

            if (IsLikelyAbbreviation(text, i))
                continue;

            var candidate = text[..(i + 1)].Trim();
            if (candidate.Length == 0)
                continue;

            buffer.Remove(0, i + 1);
            sentence = candidate;
            return true;
        }

        sentence = string.Empty;
        return false;
    }


    private static bool TryExtractFirstClause(StringBuilder buffer, out string clause)
    {
        var text = buffer.ToString();

        for (var i = MinFirstClauseLength - 1; i < text.Length; i++)
        {
            var ch = text[i];

            // A sentence that ends first is TryExtractSentence's to take.
            if (ch is '.' or '!' or '?')
                break;

            var isDash = ch is '—' or '–';
            if (!isDash && ch is not (',' or ';' or ':'))
                continue;

            // Commas, semicolons and colons count only before whitespace ("1,000" and
            // "3:30" stay whole); wait for the next token when the buffer ends here.
            // Dashes are often written without spaces ("jam—perfect").
            if (!isDash)
            {
                if (i + 1 >= text.Length)
                    break;
                if (!char.IsWhiteSpace(text[i + 1]))
                    continue;
            }

            var candidate = (isDash ? text[..i] : text[..(i + 1)]).Trim();
            buffer.Remove(0, i + 1);
            clause = candidate;
            return true;
        }

        clause = string.Empty;
        return false;
    }


    private static bool IsLikelyAbbreviation(string text, int dotIndex)
    {
        if (text[dotIndex] != '.')
            return false;

        // Walk backwards to find the start of the preceding word.
        var end = dotIndex;
        var start = end - 1;
        while (start > 0 && char.IsLetter(text[start - 1]))
            start--;

        var word = text[start..end];
        // Only flag short words - genuine sentence-ending words are almost always longer.
        return word.Length is >= 1 and <= 4 && Abbreviations.Contains(word);
    }

}

public enum ChunkingMode
{
    Narration,
    Chat,
}
