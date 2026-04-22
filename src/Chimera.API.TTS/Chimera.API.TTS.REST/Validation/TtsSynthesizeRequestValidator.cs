using Chimera.API.TTS.Domain.Models;
using Chimera.API.TTS.REST.Models;
using FluentValidation;

namespace Chimera.API.TTS.REST.Validation;

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
        
    }

}
