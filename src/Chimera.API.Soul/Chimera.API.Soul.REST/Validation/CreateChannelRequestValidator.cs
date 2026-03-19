using Chimera.API.Soul.REST.Models;
using FluentValidation;

namespace Chimera.API.Soul.REST.Validation;

public sealed class CreateChannelRequestValidator : AbstractValidator<CreateChannelRequest>
{
    #region Fields

    private static readonly string[] SupportedPlatforms = ["twitch", "discord", "youtube"];

    #endregion

    #region Constructors

    public CreateChannelRequestValidator()
    {
        RuleFor(x => x.Platform)
            .NotEmpty()
            .Must(p => SupportedPlatforms.Contains(p.ToLowerInvariant()))
            .WithMessage("Platform must be one of: twitch, discord, youtube.");

        RuleFor(x => x.ChannelName)
            .NotEmpty().WithMessage("Channel name is required.")
            .MaximumLength(100);

        RuleFor(x => x.BotUsername)
            .NotEmpty().WithMessage("Bot username is required.")
            .MaximumLength(100);
    }

    #endregion
}
