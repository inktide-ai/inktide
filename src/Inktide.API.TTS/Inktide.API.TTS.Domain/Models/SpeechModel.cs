namespace Inktide.API.TTS.Domain.Models;

public sealed record SpeechModel(string Id, string Model, DateTimeOffset Created, string OwnedBy);
