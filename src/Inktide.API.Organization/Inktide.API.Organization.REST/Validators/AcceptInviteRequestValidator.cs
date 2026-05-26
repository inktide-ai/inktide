using FluentValidation;
using Inktide.API.Organization.REST.Models;

namespace Inktide.API.Organization.REST.Validators;

public sealed class AcceptInviteRequestValidator : AbstractValidator<AcceptInviteRequest>
{
    public AcceptInviteRequestValidator()
    {
        RuleFor(x => x.Token).NotEmpty().WithMessage("Token is required.");
    }
}
