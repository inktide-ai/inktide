using Inktide.API.ScreenAwareness.Application.Settings;
using Microsoft.Extensions.Options;

namespace Inktide.API.ScreenAwareness.Infrastructure.Settings.Validators;

public sealed class ScreenAwarenessSettingsValidator : IValidateOptions<ScreenAwarenessSettings>
{

    public ValidateOptionsResult Validate(string? name, ScreenAwarenessSettings options)
    {
        var failures = new List<string>();

        if (options.VisionProvider is not ("anthropic" or "ollama"))
            failures.Add("ScreenAwareness.VisionProvider must be 'anthropic' or 'ollama'.");

        if (string.Equals(options.VisionProvider, "anthropic", StringComparison.OrdinalIgnoreCase)
            && string.IsNullOrWhiteSpace(options.AnthropicApiKey))
            failures.Add("ScreenAwareness.AnthropicApiKey is required when VisionProvider is 'anthropic'.");

        if (options.PHashThresholdDefault is < 0 or > 64)
            failures.Add("ScreenAwareness.PHashThresholdDefault must be between 0 and 64.");

        if (options.VisionTimeoutMs < 1000)
            failures.Add("ScreenAwareness.VisionTimeoutMs must be at least 1000ms.");

        if (options.FreePlanHourlyBudget < 1)
            failures.Add("ScreenAwareness.FreePlanHourlyBudget must be at least 1.");

        return failures.Count > 0
            ? ValidateOptionsResult.Fail(failures)
            : ValidateOptionsResult.Success;
    }

}
