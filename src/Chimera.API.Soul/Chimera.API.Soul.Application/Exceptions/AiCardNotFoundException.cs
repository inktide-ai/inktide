namespace Chimera.API.Soul.Application.Exceptions;

public sealed class AiCardNotFoundException : Exception
{

    private readonly Guid _cardId;


    public Guid CardId { get => _cardId; }


    public AiCardNotFoundException(Guid cardId)
        : base($"AI card {cardId} not found.")
    {
        _cardId = cardId;
    }

}
