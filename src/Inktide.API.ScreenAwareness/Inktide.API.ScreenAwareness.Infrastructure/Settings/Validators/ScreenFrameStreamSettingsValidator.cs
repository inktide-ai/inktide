using Inktide.API.ScreenAwareness.Application.Settings;
using Microsoft.Extensions.Options;

namespace Inktide.API.ScreenAwareness.Infrastructure.Settings.Validators;

public sealed class ScreenFrameStreamSettingsValidator : IValidateOptions<ScreenFrameStreamSettings>
{

    public ValidateOptionsResult Validate(string? name, ScreenFrameStreamSettings options)
    {
        var failures = new List<string>();

        if (string.IsNullOrWhiteSpace(options.StreamName))
            failures.Add("ScreenFrameStream.StreamName is required.");

        if (string.IsNullOrWhiteSpace(options.ConsumerGroup))
            failures.Add("ScreenFrameStream.ConsumerGroup is required.");

        if (options.ReadCount < 1)
            failures.Add("ScreenFrameStream.ReadCount must be at least 1.");

        if (options.StaleFrameAgeMs < 100)
            failures.Add("ScreenFrameStream.StaleFrameAgeMs must be at least 100ms.");

        return failures.Count > 0
            ? ValidateOptionsResult.Fail(failures)
            : ValidateOptionsResult.Success;
    }

}
