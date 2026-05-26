using System.ComponentModel.DataAnnotations;

namespace Inktide.API.Realtime.Infrastructure.Configuration;

/// <summary>
/// Settings for consuming LLM text chunks from the <c>synapse.llm.response</c> Redis stream
/// and delivering them to browser clients via SignalR <c>textChunk</c> events.
/// </summary>
public sealed class RealtimeTextStreamSettings : StreamConsumerSettings
{
    public const string SectionName = "RealtimeTextStream";

    [Required] public override string StreamName         { get; set; } = Inktide.API.Core.Constants.StreamNames.LlmResponse;
    [Required] public override string ConsumerGroup      { get; set; } = "text-delivery-workers";
    [Required] public override string ConsumerNamePrefix { get; set; } = "text-delivery";
}
