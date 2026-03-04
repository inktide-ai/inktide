using FluentValidation;
using Chimera.Identity.API.REST.Models;

namespace Chimera.Identity.API.REST.Validation;

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x)
            .Must(x => !string.IsNullOrEmpty(x.ApiKey)
                || ((!string.IsNullOrEmpty(x.Email) || !string.IsNullOrEmpty(x.Username))
                    && !string.IsNullOrEmpty(x.Password)))
            .WithMessage("ApiKey or Email/Username + Password required");
    }
}
