using Grpc.Core;
using Chimera.API.Soul.Application.Interfaces;
using Chimera.API.Soul.Grpc.AiCards.Service.Converters;
using Chimera.API.Soul.Grpc.Contracts.AiCards;

namespace Chimera.API.Soul.Grpc.AiCards.Service.Services;

/// <summary>
/// gRPC implementation of the Soul AiCard service.
/// Delegates all business logic to <see cref="IAiCardService"/>.
/// Domain-level exceptions are caught and converted by <see cref="Chimera.API.Soul.Grpc.Interceptors.GrpcExceptionInterceptor"/>.
/// </summary>
public sealed class AiCardsGrpcService : AiCardService.AiCardServiceBase
{
    #region Fields

    private readonly IAiCardService _aiCardService;

    #endregion

    #region Constructors

    public AiCardsGrpcService(IAiCardService aiCardService)
    {
        _aiCardService = aiCardService ?? throw new ArgumentNullException(nameof(aiCardService));
    }

    #endregion

    #region Public Methods

    public override async Task<AiCardResponse> GetCard(
        GetCardRequest request,
        ServerCallContext context)
    {
        if (!Guid.TryParse(request.UserId, out var userId))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid user_id format."));
        }

        if (!Guid.TryParse(request.CardId, out var cardId))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid card_id format."));
        }

        var card = await _aiCardService.GetByIdAsync(userId, cardId, context.CancellationToken);

        if (card is null)
        {
            throw new RpcException(new Status(StatusCode.NotFound, $"AI card '{cardId}' not found."));
        }

        return AiCardGrpcConverter.ToResponse(card);
    }

    public override async Task<ListCardsResponse> ListCards(
        ListCardsRequest request,
        ServerCallContext context)
    {
        if (!Guid.TryParse(request.UserId, out var userId))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid user_id format."));
        }

        var cards = await _aiCardService.GetAllByUserAsync(userId, context.CancellationToken);

        var response = new ListCardsResponse();
        response.Cards.AddRange(cards.Select(AiCardGrpcConverter.ToResponse));

        return response;
    }

    public override async Task<AiCardResponse> CreateCard(
        CreateCardRequest request,
        ServerCallContext context)
    {
        if (!Guid.TryParse(request.UserId, out _))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid user_id format."));
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "name is required."));
        }

        if (string.IsNullOrWhiteSpace(request.Slug))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "slug is required."));
        }

        var card = AiCardGrpcConverter.ToDomain(request);
        var created = await _aiCardService.CreateAsync(
            Guid.Parse(request.UserId),
            card,
            context.CancellationToken);

        return AiCardGrpcConverter.ToResponse(created);
    }

    public override async Task<AiCardResponse> UpdateCard(
        UpdateCardRequest request,
        ServerCallContext context)
    {
        if (!Guid.TryParse(request.UserId, out var userId))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid user_id format."));
        }

        if (!Guid.TryParse(request.CardId, out var cardId))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid card_id format."));
        }

        var existing = await _aiCardService.GetByIdAsync(userId, cardId, context.CancellationToken);

        if (existing is null)
        {
            throw new RpcException(new Status(StatusCode.NotFound, $"AI card '{cardId}' not found."));
        }

        AiCardGrpcConverter.ApplyUpdate(request, existing);

        var updated = await _aiCardService.UpdateAsync(userId, existing, context.CancellationToken);

        return AiCardGrpcConverter.ToResponse(updated);
    }

    public override async Task<DeleteCardResponse> DeleteCard(
        DeleteCardRequest request,
        ServerCallContext context)
    {
        if (!Guid.TryParse(request.UserId, out var userId))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid user_id format."));
        }

        if (!Guid.TryParse(request.CardId, out var cardId))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid card_id format."));
        }

        await _aiCardService.DeleteAsync(userId, cardId, context.CancellationToken);

        return new DeleteCardResponse { Success = true };
    }

    #endregion
}
