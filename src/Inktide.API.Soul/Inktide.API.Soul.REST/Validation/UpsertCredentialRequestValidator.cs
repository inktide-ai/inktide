using FluentValidation;
using Inktide.API.Soul.REST.Models;

namespace Inktide.API.Soul.REST.Validation;

public sealed class UpsertCredentialRequestValidator : AbstractValidator<UpsertCredentialRequest>
{
    public UpsertCredentialRequestValidator()
    {
        When(x => x.ApiKey is not null, () =>
            RuleFor(x => x.ApiKey!).MaximumLength(2048).WithMessage("api_key must be at most 2048 characters."));

        When(x => x.BaseUrl is not null, () =>
            RuleFor(x => x.BaseUrl!)
                .MaximumLength(512).WithMessage("base_url must be at most 512 characters.")
                .Must(BeAValidHttpUrl).WithMessage("base_url must be a valid http or https URL."));

        When(x => x.Config is not null, () =>
            RuleFor(x => x.Config!).MaximumLength(10_000).WithMessage("config must be at most 10000 characters."));
    }

    private static bool BeAValidHttpUrl(string url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var uri)
        && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
}
