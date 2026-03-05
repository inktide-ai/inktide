using FluentValidation;
using Chimera.Identity.API.REST.Models;

namespace Chimera.Identity.API.REST.Validation;

/// <summary>Validates <see cref="RegisterRequest"/> before the controller is called.</summary>
public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email format.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.");
    }
}
