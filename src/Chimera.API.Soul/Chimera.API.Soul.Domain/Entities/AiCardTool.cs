namespace Chimera.API.Soul.Domain.Entities;

/// <summary>
/// An enabled tool/capability for an AI card (web_search, calculator, weather, etc.).
/// Each tool has its own JSONB config blob.
/// </summary>
public sealed class AiCardTool
{
    #region Fields

    private Guid _id;
    private Guid _aiCardId;
    private string _toolName = string.Empty;
    private string _toolConfig = "{}";
    private bool _isEnabled = true;
    private DateTime _createdAt;
    private AiCard? _aiCard;

    #endregion

    #region Properties

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

    public string ToolName
    {
        get => _toolName;
        set => _toolName = value;
    }

    /// <summary>Tool-specific settings (e.g. max_results for web_search).</summary>
    public string ToolConfig
    {
        get => _toolConfig;
        set => _toolConfig = value;
    }

    public bool IsEnabled
    {
        get => _isEnabled;
        set => _isEnabled = value;
    }

    public DateTime CreatedAt
    {
        get => _createdAt;
        set => _createdAt = value;
    }

    public AiCard? AiCard
    {
        get => _aiCard;
        set => _aiCard = value;
    }

    #endregion
}
