namespace Chimera.API.Soul.Application.Exceptions;

public sealed class AiCardNotFoundException : Exception
{
    #region Fields

    private readonly Guid _cardId;

    #endregion

    #region Properties

    public Guid CardId { get => _cardId; }

    #endregion

    #region Constructors

    public AiCardNotFoundException(Guid cardId)
        : base($"AI card {cardId} not found.")
    {
        _cardId = cardId;
    }

    #endregion
}
