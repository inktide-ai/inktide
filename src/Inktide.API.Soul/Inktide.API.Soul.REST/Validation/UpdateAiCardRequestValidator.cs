using Inktide.API.Soul.REST.Models;
using FluentValidation;

namespace Inktide.API.Soul.REST.Validation;

public sealed class UpdateAiCardRequestValidator : AbstractValidator<UpdateAiCardRequest>
{

    public UpdateAiCardRequestValidator()
    {
        When(x => x.Name is not null, () =>
            RuleFor(x => x.Name!).NotEmpty().MaximumLength(100));

        When(x => x.SystemPrompt is not null, () =>
            RuleFor(x => x.SystemPrompt!).NotEmpty().MaximumLength(10_000));

        When(x => x.Personality is not null, () =>
            RuleFor(x => x.Personality!).MaximumLength(1000));

        When(x => x.LlmConfig is not null, () =>
        {
            RuleFor(x => x.LlmConfig!.Temperature).InclusiveBetween(0.0, 2.0);
            RuleFor(x => x.LlmConfig!.TopP).InclusiveBetween(0.0, 1.0);
            RuleFor(x => x.LlmConfig!.MaxTokens).InclusiveBetween(1, 128_000);
        });

        When(x => x.TtsConfig is not null, () =>
        {
            RuleFor(x => x.TtsConfig!.Speed).InclusiveBetween(0.1, 4.0);
        });
    }

}
