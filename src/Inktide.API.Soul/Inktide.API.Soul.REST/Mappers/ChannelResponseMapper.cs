using Inktide.API.Soul.Application.Models;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.REST.Models;

namespace Inktide.API.Soul.REST.Mappers;

/// <summary>
/// Maps channel domain entities and application DTOs to REST response models.
/// SRP: one reason to change — channel read representation.
/// ISP: consumers that only query channels do not pull in card-level mappers.
/// </summary>
public static class ChannelResponseMapper
{
    public static ChannelResponse ToChannelResponse(AiCardChannel channel)
    {
        ArgumentNullException.ThrowIfNull(channel);
        return new ChannelResponse
        {
            Id           = channel.Id,
            Platform     = channel.Platform,
            ChannelName  = channel.ChannelName,
            ChannelId    = channel.ChannelId,
            BotUsername  = channel.BotUsername,
            IsActive     = channel.IsActive,
            ConnectedAt  = channel.ConnectedAt,
            HasCustomBot = channel.CustomBotTokenEnc is not null,
        };
    }

    public static ChannelResponse ToChannelResponse(ChannelLink dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        return new ChannelResponse
        {
            Id           = dto.Id,
            Platform     = dto.Platform,
            ChannelName  = dto.ChannelName,
            ChannelId    = dto.ChannelId,
            BotUsername  = dto.BotUsername,
            IsActive     = dto.IsActive,
            ConnectedAt  = dto.ConnectedAt,
            HasCustomBot = dto.HasCustomBot,
        };
    }
}
