using System.ComponentModel.DataAnnotations;

namespace Inktide.API.Realtime.Infrastructure.Configuration;

/// <summary>
/// Settings for consuming synthesized audio from the <c>synapse.tts.ready</c> Redis stream
/// and delivering it to connected browser clients via SignalR.
/// </summary>
public sealed class RealtimeStreamSettings : StreamConsumerSettings
{
    public const string SectionName = "RealtimeStream";

    [Required] public override string StreamName         { get; set; } = Inktide.API.Core.Constants.StreamNames.TtsReady;
    [Required] public override string ConsumerGroup      { get; set; } = "realtime-workers";
    [Required] public override string ConsumerNamePrefix { get; set; } = "realtime";
}
