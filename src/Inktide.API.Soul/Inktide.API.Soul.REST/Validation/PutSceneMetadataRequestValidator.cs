using Inktide.API.Soul.REST.Models;
using FluentValidation;

namespace Inktide.API.Soul.REST.Validation;

public sealed class PutSceneMetadataRequestValidator : AbstractValidator<PutSceneMetadataRequest>
{

    public PutSceneMetadataRequestValidator()
    {
        When(
            x => x.DisplayName is not null,
            () =>
            {
                RuleFor(x => x.DisplayName!)
                    .MaximumLength(200).WithMessage("display_name must be at most 200 characters.");
            });

        When(
            x => x.Description is not null,
            () =>
            {
                RuleFor(x => x.Description!)
                    .MaximumLength(2000).WithMessage("description must be at most 2000 characters.");
            });

        When(
            x => x.Tag is not null,
            () =>
            {
                RuleFor(x => x.Tag!)
                    .MaximumLength(128).WithMessage("tag must be at most 128 characters.");
            });
    }

}
