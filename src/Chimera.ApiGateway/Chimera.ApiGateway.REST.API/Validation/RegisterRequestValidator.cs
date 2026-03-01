using FluentValidation;
using Chimera.ApiGateway.REST.API.Models;

namespace Chimera.ApiGateway.REST.API.Validation;

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
