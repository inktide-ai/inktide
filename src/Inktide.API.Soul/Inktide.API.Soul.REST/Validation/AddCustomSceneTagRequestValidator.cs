using Inktide.API.Soul.REST.Models;
using FluentValidation;

namespace Inktide.API.Soul.REST.Validation;

public sealed class AddCustomSceneTagRequestValidator : AbstractValidator<AddCustomSceneTagRequest>
{

    public AddCustomSceneTagRequestValidator()
    {
        RuleFor(x => x.Label)
            .NotEmpty().WithMessage("label is required.")
            .MaximumLength(128).WithMessage("label must be at most 128 characters.");

        RuleFor(x => x.Color)
            .Matches(@"^#[0-9a-fA-F]{6}$").WithMessage("color must be a valid hex color, e.g. '#818cf8'.")
            .When(x => !string.IsNullOrWhiteSpace(x.Color));
    }

}
