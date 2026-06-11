namespace Inktide.API.Soul.REST.Models;

public sealed record AiCardStatsResponse(
    int Messages24h,
    int LlmCalls24h,
    int TtsChars24h,
    int MemoryCount);
