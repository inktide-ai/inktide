using Inktide.API.Soul.REST.Models;
using FluentValidation;

namespace Inktide.API.Soul.REST.Validation;

public sealed class CompleteSceneUploadRequestValidator : AbstractValidator<CompleteSceneUploadRequest>
{

    public CompleteSceneUploadRequestValidator()
    {
        RuleFor(x => x.StorageKey)
            .NotEmpty().WithMessage("storage_key is required.");

        RuleFor(x => x.FileName)
            .NotEmpty().WithMessage("file_name is required.");

        RuleFor(x => x.ContentType)
            .NotEmpty().WithMessage("content_type is required.");

        RuleFor(x => x.SizeBytes)
            .GreaterThan(0).WithMessage("size_bytes must be positive.");

        When(
            x => x.Tag is not null,
            () =>
            {
                RuleFor(x => x.Tag!)
                    .MaximumLength(128).WithMessage("tag must be at most 128 characters.");
            });
    }

}
