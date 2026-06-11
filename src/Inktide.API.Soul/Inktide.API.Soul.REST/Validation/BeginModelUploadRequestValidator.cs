using FluentValidation;
using Inktide.API.Soul.REST.Models;

namespace Inktide.API.Soul.REST.Validation;

public sealed class BeginModelUploadRequestValidator : AbstractValidator<BeginModelUploadRequest>
{
    public BeginModelUploadRequestValidator()
    {
        RuleFor(x => x.FileName)
            .NotEmpty().WithMessage("file_name is required.")
            .MaximumLength(256).WithMessage("file_name must be at most 256 characters.");

        RuleFor(x => x.ContentType)
            .NotEmpty().WithMessage("content_type is required.")
            .MaximumLength(128).WithMessage("content_type must be at most 128 characters.");

        RuleFor(x => x.SizeBytes)
            .InclusiveBetween(1, 524_288_000).WithMessage("size_bytes must be between 1 and 500 MB.");
    }
}
