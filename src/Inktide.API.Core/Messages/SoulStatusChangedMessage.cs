namespace Inktide.API.Core.Messages;

public sealed record SoulStatusChangedMessage(Guid CardId, bool IsActive, string Status);
