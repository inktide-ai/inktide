using Inktide.API.TTS.Application.Synthesis;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Inktide.API.TTS.REST.Extensions;

internal static class SpeechValidationErrorExtensions
{
    internal static ModelStateDictionary ToModelStateDictionary(this IReadOnlyList<SpeechValidationError> errors)
    {
        var modelState = new ModelStateDictionary();
        foreach (var error in errors)
        {
            modelState.AddModelError(error.PropertyName, error.ErrorMessage);
        }
        return modelState;
    }
}
