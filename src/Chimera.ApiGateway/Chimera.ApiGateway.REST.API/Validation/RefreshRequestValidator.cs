using FluentValidation;
using Chimera.ApiGateway.REST.API.Models;

namespace Chimera.ApiGateway.REST.API.Validation;

public sealed class RefreshRequestValidator : AbstractValidator<RefreshRequest>
{
    public RefreshRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required");
    }
}
