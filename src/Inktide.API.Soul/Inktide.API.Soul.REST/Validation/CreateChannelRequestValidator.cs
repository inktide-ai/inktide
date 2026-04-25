using Inktide.API.Soul.REST.Models;
using FluentValidation;

namespace Inktide.API.Soul.REST.Validation;

public sealed class CreateChannelRequestValidator : AbstractValidator<CreateChannelRequest>
{

    private static readonly string[] SupportedPlatforms =
        ["twitch", "discord", "youtube", "kick", "vk_video"];


    public CreateChannelRequestValidator()
    {
        RuleFor(x => x.Platform)
            .NotEmpty()
            .Must(p => SupportedPlatforms.Contains(p.ToLowerInvariant()))
            .WithMessage("Platform must be one of: twitch, discord, youtube, kick, vk_video.");

        RuleFor(x => x.ChannelName)
            .NotEmpty().WithMessage("Display name is required.")
            .MaximumLength(100);

        RuleFor(x => x.BotUsername)
            .NotEmpty().WithMessage("Bot username is required.")
            .MaximumLength(100);

        When(
            x => string.Equals(x.Platform, "discord", StringComparison.OrdinalIgnoreCase),
            () =>
            {
                RuleFor(x => x.ChannelId)
                    .NotEmpty()
                    .WithMessage("Discord requires channel_id: your server (guild) snowflake id.")
                    .Matches(@"^\d{17,20}$")
                    .WithMessage("channel_id must be a numeric Discord guild id (17–20 digits).");
            });

        When(
            x => IsIngestChannelIdPlatform(x.Platform),
            () =>
            {
                RuleFor(x => x.ChannelId)
                    .NotEmpty()
                    .WithMessage("channel_id is required and must match the connector ingest ChannelId for this platform.")
                    .MaximumLength(100)
                    .Matches(@"^[a-zA-Z0-9_\-]+$")
                    .WithMessage("channel_id may contain letters, digits, underscore and hyphen only.");
            });
    }

    private static bool IsIngestChannelIdPlatform(string? platform)
    {
        if (string.IsNullOrEmpty(platform))
        {
            return false;
        }

        var p = platform.ToLowerInvariant();
        return p is "twitch" or "kick" or "vk_video";
    }

}
