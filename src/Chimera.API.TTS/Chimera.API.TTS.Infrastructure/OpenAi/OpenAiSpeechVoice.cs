using Chimera.API.TTS.Domain.Models;

namespace Chimera.API.Domain.Enums;

/// <summary>
/// OpenAI TTS voice id. Known voices from the OpenAI Audio API (as of 2024-11-20);
/// arbitrary strings remain valid via constructor or implicit conversion from <see cref="string"/>.
/// </summary>
public readonly struct OpenAiSpeechVoice : IEquatable<OpenAiSpeechVoice>
{

    private readonly string _value;


    private const string AlloyValue   = "alloy";
    private const string AshValue     = "ash";
    private const string BalladValue  = "ballad";
    private const string CoralValue   = "coral";
    private const string EchoValue    = "echo";
    private const string FableValue   = "fable";
    private const string NovaValue    = "nova";
    private const string OnyxValue    = "onyx";
    private const string SageValue    = "sage";
    private const string ShimmerValue = "shimmer";
    private const string VerseValue   = "verse";


    public OpenAiSpeechVoice(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        _value = value;
    }


    public static OpenAiSpeechVoice Alloy   { get; } = new OpenAiSpeechVoice(AlloyValue);
    public static OpenAiSpeechVoice Ash     { get; } = new OpenAiSpeechVoice(AshValue);
    public static OpenAiSpeechVoice Ballad  { get; } = new OpenAiSpeechVoice(BalladValue);
    public static OpenAiSpeechVoice Coral   { get; } = new OpenAiSpeechVoice(CoralValue);
    public static OpenAiSpeechVoice Echo    { get; } = new OpenAiSpeechVoice(EchoValue);
    public static OpenAiSpeechVoice Fable   { get; } = new OpenAiSpeechVoice(FableValue);
    public static OpenAiSpeechVoice Nova    { get; } = new OpenAiSpeechVoice(NovaValue);
    public static OpenAiSpeechVoice Onyx    { get; } = new OpenAiSpeechVoice(OnyxValue);
    public static OpenAiSpeechVoice Sage    { get; } = new OpenAiSpeechVoice(SageValue);
    public static OpenAiSpeechVoice Shimmer { get; } = new OpenAiSpeechVoice(ShimmerValue);
    public static OpenAiSpeechVoice Verse   { get; } = new OpenAiSpeechVoice(VerseValue);


    public static bool operator ==(OpenAiSpeechVoice left, OpenAiSpeechVoice right) => left.Equals(right);

    public static bool operator !=(OpenAiSpeechVoice left, OpenAiSpeechVoice right) => !left.Equals(right);

    public static implicit operator OpenAiSpeechVoice(string value)  => new(value);

    public static implicit operator OpenAiSpeechVoice?(string? value) =>
        value is null ? default : new OpenAiSpeechVoice(value);


    public override bool Equals(object? obj) => obj is OpenAiSpeechVoice other && Equals(other);

    public bool Equals(OpenAiSpeechVoice other) =>
        string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);

    public override int GetHashCode() =>
        _value is not null ? StringComparer.InvariantCultureIgnoreCase.GetHashCode(_value) : 0;

    public override string ToString() => _value;


    /// <summary>Returns all known OpenAI TTS voices as a <see cref="SpeechVoiceCollection"/>.</summary>
    public static SpeechVoiceCollection ToCollection() => new(
    [
        new(AlloyValue),   new(AshValue),    new(BalladValue), new(CoralValue),
        new(EchoValue),    new(FableValue),  new(NovaValue),   new(OnyxValue),
        new(SageValue),    new(ShimmerValue), new(VerseValue),
    ]);

}
