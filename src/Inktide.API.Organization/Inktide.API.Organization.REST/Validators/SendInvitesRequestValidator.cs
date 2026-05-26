using FluentValidation;
using Inktide.API.Organization.Application.Enums;
using Inktide.API.Organization.REST.Models;

namespace Inktide.API.Organization.REST.Validators;

public sealed class SendInvitesRequestValidator : AbstractValidator<SendInvitesRequest>
{
    public SendInvitesRequestValidator()
    {
        RuleFor(x => x.Emails).NotEmpty().WithMessage("At least one email is required.");
        RuleForEach(x => x.Emails).EmailAddress();
        RuleFor(x => x.Role).IsEnumName(typeof(OrganizationRole), caseSensitive: false);
    }
}
