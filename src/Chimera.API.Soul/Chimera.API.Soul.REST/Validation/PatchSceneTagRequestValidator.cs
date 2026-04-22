using Chimera.API.Soul.REST.Models;
using FluentValidation;

namespace Chimera.API.Soul.REST.Validation;

public sealed class PatchSceneTagRequestValidator : AbstractValidator<PatchSceneTagRequest>
{

    public PatchSceneTagRequestValidator()
    {
        When(
            x => x.Tag is not null,
            () =>
            {
                RuleFor(x => x.Tag!)
                    .MaximumLength(128).WithMessage("tag must be at most 128 characters.");
            });
    }

}
