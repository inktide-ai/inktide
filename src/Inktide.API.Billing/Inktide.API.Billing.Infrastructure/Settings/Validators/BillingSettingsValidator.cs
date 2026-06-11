using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace Inktide.API.Billing.Infrastructure.Settings.Validators;

public sealed class BillingSettingsValidator : IValidateOptions<BillingSettings>
{
    private readonly IHostEnvironment _env;

    public BillingSettingsValidator(IHostEnvironment env) => _env = env;

    public ValidateOptionsResult Validate(string? name, BillingSettings options)
    {
        if (!_env.IsProduction()) return ValidateOptionsResult.Success;

        var failures = new List<string>();

        if (options.SuccessUrl.Contains("localhost", StringComparison.OrdinalIgnoreCase))
            failures.Add("BillingSettings.SuccessUrl contains 'localhost' — set BillingSettings__SuccessUrl in production.");

        if (options.CancelUrl.Contains("localhost", StringComparison.OrdinalIgnoreCase))
            failures.Add("BillingSettings.CancelUrl contains 'localhost' — set BillingSettings__CancelUrl in production.");

        return failures.Count > 0
            ? ValidateOptionsResult.Fail(failures)
            : ValidateOptionsResult.Success;
    }
}
