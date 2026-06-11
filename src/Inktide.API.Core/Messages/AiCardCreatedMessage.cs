namespace Inktide.API.Core.Messages;

public sealed record AiCardCreatedMessage(Guid CardId, Guid UserId, string CardName);
