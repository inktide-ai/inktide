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

        RuleFor(x => x.LlmCatalogId)
            .NotEmpty().WithMessage("LLM model selection is required.");


        RuleFor(x => x.AvatarUrl)
            .Must(IsValidHttpUrl)
            .When(x => x.AvatarUrl is not null)
            .WithMessage("avatar_url must be a valid HTTP/HTTPS URL.");


        When(x => x.LlmConfig is not null, () =>
        {
            RuleFor(x => x.LlmConfig!.Temperature).InclusiveBetween(0.0, 2.0);
            RuleFor(x => x.LlmConfig!.TopP).InclusiveBetween(0.0, 1.0);
            RuleFor(x => x.LlmConfig!.MaxTokens).InclusiveBetween(1, 128_000);
            RuleFor(x => x.LlmConfig!.FrequencyPenalty).InclusiveBetween(-2.0, 2.0);
            RuleFor(x => x.LlmConfig!.PresencePenalty).InclusiveBetween(-2.0, 2.0);

            RuleFor(x => x.LlmConfig!.BaseUrl)
                .Must(IsValidHttpsUrl)
                .When(x => x.LlmConfig!.BaseUrl is not null)
                .WithMessage("llm_config.base_url must be a valid HTTPS URL.");
        });


        When(x => x.TtsConfig is not null, () =>
        {
            RuleFor(x => x.TtsConfig!.Speed).InclusiveBetween(0.1, 4.0);
            RuleFor(x => x.TtsConfig!.Pitch).InclusiveBetween(-50.0, 50.0);
            RuleFor(x => x.TtsConfig!.Volume).InclusiveBetween(-50.0, 50.0);
            RuleFor(x => x.TtsConfig!.Stability).InclusiveBetween(0.0, 1.0);
            RuleFor(x => x.TtsConfig!.SimilarityBoost).InclusiveBetween(0.0, 1.0);
            RuleFor(x => x.TtsConfig!.Style).InclusiveBetween(0.0, 1.0);

            RuleFor(x => x.TtsConfig!.BaseUrl)
                .Must(IsValidHttpsUrl)
                .When(x => x.TtsConfig!.BaseUrl is not null)
                .WithMessage("tts_config.base_url must be a valid HTTPS URL.");
        });
    }

    private static bool IsValidHttpUrl(string? url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var u)
        && (u.Scheme == Uri.UriSchemeHttp || u.Scheme == Uri.UriSchemeHttps);

    private static bool IsValidHttpsUrl(string? url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var u)
        && u.Scheme == Uri.UriSchemeHttps;
}
