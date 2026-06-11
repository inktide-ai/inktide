using FluentValidation;
using Inktide.API.Soul.REST.Models;

namespace Inktide.API.Soul.REST.Validation;

public sealed class ChangeCardStatusRequestValidator : AbstractValidator<ChangeCardStatusRequest>
{
    private static readonly string[] AllowedActions = ["start", "pause", "stop"];

    public ChangeCardStatusRequestValidator()
    {
        RuleFor(x => x.Action)
            .NotEmpty().WithMessage("action is required.")
            .Must(a => AllowedActions.Contains(a)).WithMessage("action must be one of: start, pause, stop.");
    }
}
