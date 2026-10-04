using Inktide.API.Synapse.Infrastructure.Llm;
using Xunit;

namespace Inktide.API.Synapse.Tests.Llm;

public sealed class SentenceAccumulatorTests
{

    // LLMs stream a few characters at a time; boundaries must survive arbitrary splits.
    private static async IAsyncEnumerable<string> Stream(string text, int tokenLength = 3)
    {
        for (var i = 0; i < text.Length; i += tokenLength)
        {
            await Task.Yield();
            yield return text.Substring(i, Math.Min(tokenLength, text.Length - i));
        }
    }

    private static async Task<List<string>> Chunks(string text, int tokenLength = 3)
    {
        var chunks = new List<string>();
        await foreach (var chunk in SentenceAccumulator.AccumulateAsync(Stream(text, tokenLength)))
            chunks.Add(chunk);
        return chunks;
    }


    [Fact]
    public async Task FirstChunk_EndsAtTheFirstLongEnoughClause()
    {
        var chunks = await Chunks("Oh, benchmark, gotta say salty chips are my jam. Perfect crunch every time.");

        Assert.Equal(
            ["Oh, benchmark,", "gotta say salty chips are my jam.", "Perfect crunch every time."],
            chunks);
    }

    [Fact]
    public async Task OnlyTheFirstChunk_SplitsAtClauses()
    {
        var chunks = await Chunks("Alright chat, here is the plan. First we eat, then we play, then we sleep.");

        Assert.Equal(
            ["Alright chat,", "here is the plan.", "First we eat, then we play, then we sleep."],
            chunks);
    }

    [Fact]
    public async Task SentenceThatEndsBeforeAnyLongEnoughClause_IsKeptWhole()
    {
        var chunks = await Chunks("Nice one, mate! You did it, chat.");

        Assert.Equal(["Nice one, mate!", "You did it, chat."], chunks);
    }

    [Fact]
    public async Task NumbersAndTimes_AreNotClauseBoundaries()
    {
        var chunks = await Chunks("We hit 1,000 followers at 3:30 today, which is wild. Thank you all.");

        Assert.Equal(
            ["We hit 1,000 followers at 3:30 today,", "which is wild.", "Thank you all."],
            chunks);
    }

    [Fact]
    public async Task UnspacedDash_EndsTheFirstClauseAndIsDropped()
    {
        var chunks = await Chunks("Salty chips are my jam—perfect crunch every single time.");

        Assert.Equal(["Salty chips are my jam", "perfect crunch every single time."], chunks);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(7)]
    [InlineData(64)]
    public async Task Boundaries_DoNotDependOnTokenSize(int tokenLength)
    {
        var chunks = await Chunks("Oh, benchmark, absolutely! Let us go.", tokenLength);

        Assert.Equal(["Oh, benchmark,", "absolutely!", "Let us go."], chunks);
    }
}
