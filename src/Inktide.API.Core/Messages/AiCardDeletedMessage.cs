namespace Inktide.API.Core.Messages;

public sealed record AiCardDeletedMessage(Guid CardId, Guid UserId);
