using FluentValidation;
using Chimera.Identity.API.REST.Models;

namespace Chimera.Identity.API.REST.Validation;

public sealed class RefreshRequestValidator : AbstractValidator<RefreshRequest>
{
    public RefreshRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required");
    }
}
