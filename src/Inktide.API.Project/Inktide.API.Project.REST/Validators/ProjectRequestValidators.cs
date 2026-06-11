using FluentValidation;
using Inktide.API.Project.REST.Models;

namespace Inktide.API.Project.REST.Validators;

public sealed class CreateProjectRequestValidator : AbstractValidator<CreateProjectRequest>
{
    public CreateProjectRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("name is required.")
            .MaximumLength(256).WithMessage("name must be at most 256 characters.");

        When(x => x.Description is not null, () =>
            RuleFor(x => x.Description!).MaximumLength(2048).WithMessage("description must be at most 2048 characters."));
    }
}

public sealed class UpdateProjectRequestValidator : AbstractValidator<UpdateProjectRequest>
{
    public UpdateProjectRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("name is required.")
            .MaximumLength(256).WithMessage("name must be at most 256 characters.");

        When(x => x.Description is not null, () =>
            RuleFor(x => x.Description!).MaximumLength(2048).WithMessage("description must be at most 2048 characters."));

        When(x => x.SystemPrompt is not null, () =>
            RuleFor(x => x.SystemPrompt!).MaximumLength(10_000).WithMessage("system_prompt must be at most 10000 characters."));
    }
}
