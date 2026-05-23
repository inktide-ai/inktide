namespace Inktide.API.Soul.Domain.Entities;

/// <summary>
/// Pre-aggregated daily usage counters per AI card.
/// Updated via upsert (INSERT ON CONFLICT DO UPDATE) for atomic increments.
/// </summary>
public sealed class UsageDaily
{

    private Guid _id;
    private Guid _aiCardId;
    private DateOnly _usageDate;
    private int _llmCalls;
    private int _tokensPrompt;
    private int _tokensCompletion;
    private int _messagesReceived;
    private int _messagesSent;
    private int _ttsCharacters;
    private int _donkeyThoughts;
    private int _visionFramesProcessed;
    private int _visionEventsDetected;
    private AiCard? _aiCard;


    public Guid Id
    {
        get => _id;
        set => _id = value;
    }

    public Guid AiCardId
    {
        get => _aiCardId;
        set => _aiCardId = value;
    }

    public DateOnly UsageDate
    {
        get => _usageDate;
        set => _usageDate = value;
    }

    public int LlmCalls
    {
        get => _llmCalls;
        set => _llmCalls = value;
    }

    public int TokensPrompt
    {
        get => _tokensPrompt;
        set => _tokensPrompt = value;
    }

    public int TokensCompletion
    {
        get => _tokensCompletion;
        set => _tokensCompletion = value;
    }

    public int MessagesReceived
    {
        get => _messagesReceived;
        set => _messagesReceived = value;
    }

    public int MessagesSent
    {
        get => _messagesSent;
        set => _messagesSent = value;
    }

    public int TtsCharacters
    {
        get => _ttsCharacters;
        set => _ttsCharacters = value;
    }

    public int DonkeyThoughts
    {
        get => _donkeyThoughts;
        set => _donkeyThoughts = value;
    }

    public int VisionFramesProcessed
    {
        get => _visionFramesProcessed;
        set => _visionFramesProcessed = value;
    }

    public int VisionEventsDetected
    {
        get => _visionEventsDetected;
        set => _visionEventsDetected = value;
    }

    public AiCard? AiCard
    {
        get => _aiCard;
        set => _aiCard = value;
    }

}
