using Inktide.API.TTS.Domain.Models;
using Inktide.API.TTS.REST.Models;
using FluentValidation;

namespace Inktide.API.TTS.REST.Validation;

public sealed class TtsSynthesizeRequestValidator : AbstractValidator<TtsSynthesizeRequest>
{

    public TtsSynthesizeRequestValidator()
    {
        RuleFor(x => x.Text)
            .NotEmpty().WithMessage("text is required.")
            .MaximumLength(50_000);

        RuleFor(x => x.VoiceId)
            .NotEmpty().WithMessage("voice_id is required.")
            .MaximumLength(256);

        RuleFor(x => x.ModelId)
            .MaximumLength(128)
            .When(x => !string.IsNullOrEmpty(x.ModelId));

        RuleFor(x => x.Speed)
            .InclusiveBetween(0.25f, 4f)
            .When(x => x.Speed.HasValue);

        RuleFor(x => x.ProviderId)
            .MaximumLength(64)
            .When(x => !string.IsNullOrEmpty(x.ProviderId));

        When(x => x.ProviderParams is not null, () =>
            RuleFor(x => x.ProviderParams!)
                .Must(p => p.Count <= 20).WithMessage("provider_params must not exceed 20 entries."));
    }

}
