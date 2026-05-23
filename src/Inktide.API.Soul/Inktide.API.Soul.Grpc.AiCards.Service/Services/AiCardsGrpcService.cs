using Grpc.Core;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Grpc.AiCards.Service.Converters;
using Inktide.API.Soul.Grpc.AiCards.Service.Parsing;
using Inktide.API.Soul.Grpc.Contracts.AiCards;

namespace Inktide.API.Soul.Grpc.AiCards.Service.Services;

/// <summary>
/// gRPC implementation of the Soul AiCard service.
/// Delegates all business logic to <see cref="IAiCardService"/>.
/// Domain-level exceptions are caught and converted by <see cref="Inktide.API.Soul.Grpc.Interceptors.GrpcExceptionInterceptor"/>.
/// </summary>
public sealed class AiCardsGrpcService : AiCardService.AiCardServiceBase
{

    private readonly IAiCardService _aiCardService;


    public AiCardsGrpcService(IAiCardService aiCardService)
    {
        _aiCardService = aiCardService ?? throw new ArgumentNullException(nameof(aiCardService));
    }


    public override async Task<AiCardResponse> GetCard(
        GetCardRequest request,
        ServerCallContext context)
    {
        if (!GrpcGuidParser.TryParse(request.UserId, "user_id", out var userId, out var err)) throw err!;
        if (!GrpcGuidParser.TryParse(request.CardId, "card_id", out var cardId, out err)) throw err!;

        var card = await _aiCardService.GetByIdAsync(userId, cardId, context.CancellationToken);

        if (card is null)
            throw new RpcException(new Status(StatusCode.NotFound, $"AI card '{cardId}' not found."));

        return AiCardGrpcConverter.ToResponse(card);
    }

    public override async Task<ListCardsResponse> ListCards(
        ListCardsRequest request,
        ServerCallContext context)
    {
        if (!GrpcGuidParser.TryParse(request.UserId, "user_id", out var userId, out var err)) throw err!;

        var cards = await _aiCardService.GetAllByUserAsync(userId, context.CancellationToken);

        var response = new ListCardsResponse();
        response.Cards.AddRange(cards.Select(AiCardGrpcConverter.ToResponse));

        return response;
    }

    public override async Task<AiCardResponse> CreateCard(
        CreateCardRequest request,
        ServerCallContext context)
    {
        if (!GrpcGuidParser.TryParse(request.UserId, "user_id", out var userId, out var err)) throw err!;

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new RpcException(new Status(StatusCode.InvalidArgument, "name is required."));

        if (string.IsNullOrWhiteSpace(request.Slug))
            throw new RpcException(new Status(StatusCode.InvalidArgument, "slug is required."));

        var card    = AiCardGrpcConverter.ToDomain(request);
        var created = await _aiCardService.CreateAsync(userId, card, ct: context.CancellationToken);

        return AiCardGrpcConverter.ToResponse(created);
    }

    public override async Task<AiCardResponse> UpdateCard(
        UpdateCardRequest request,
        ServerCallContext context)
    {
        if (!GrpcGuidParser.TryParse(request.UserId, "user_id", out var userId, out var err)) throw err!;
        if (!GrpcGuidParser.TryParse(request.CardId, "card_id", out var cardId, out err)) throw err!;

        var existing = await _aiCardService.GetByIdAsync(userId, cardId, context.CancellationToken);

        if (existing is null)
            throw new RpcException(new Status(StatusCode.NotFound, $"AI card '{cardId}' not found."));

        AiCardGrpcConverter.ApplyUpdate(request, existing);

        var updated = await _aiCardService.UpdateAsync(userId, existing, context.CancellationToken);

        return AiCardGrpcConverter.ToResponse(updated);
    }

    public override async Task<DeleteCardResponse> DeleteCard(
        DeleteCardRequest request,
        ServerCallContext context)
    {
        if (!GrpcGuidParser.TryParse(request.UserId, "user_id", out var userId, out var err)) throw err!;
        if (!GrpcGuidParser.TryParse(request.CardId, "card_id", out var cardId, out err)) throw err!;

        await _aiCardService.DeleteAsync(userId, cardId, context.CancellationToken);

        return new DeleteCardResponse { Success = true };
    }

}
