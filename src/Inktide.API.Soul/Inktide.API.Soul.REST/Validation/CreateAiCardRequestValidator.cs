using Inktide.API.Soul.REST.Models;
using FluentValidation;

namespace Inktide.API.Soul.REST.Validation;

public sealed class CreateAiCardRequestValidator : AbstractValidator<CreateAiCardRequest>
{

    public CreateAiCardRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(100);

        RuleFor(x => x.SystemPrompt)
            .NotEmpty().WithMessage("System prompt is required.")
            .MaximumLength(10_000);

        RuleFor(x => x.LlmCatalogId)
            .NotEmpty().WithMessage("LLM model selection is required.");

        RuleFor(x => x.Personality)
            .MaximumLength(1000);
    }

}
