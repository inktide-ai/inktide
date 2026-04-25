using Microsoft.Extensions.Options;

namespace Inktide.API.Core.Settings.Validators;

/// <summary>Validates <see cref="RedisSettings"/> at application startup.</summary>
public sealed class RedisSettingsValidator : IValidateOptions<RedisSettings>
{
    public ValidateOptionsResult Validate(string? name, RedisSettings options)
    {
        var failures = new List<string>();

        if (string.IsNullOrWhiteSpace(options.BaseAddress))
        {
            failures.Add("RedisSettings.BaseAddress is required.");
        }

        if (options.BasePort is <= 0 or > 65535)
        {
            failures.Add("RedisSettings.BasePort must be a valid port (1–65535).");
        }

        return failures.Count > 0
            ? ValidateOptionsResult.Fail(failures)
            : ValidateOptionsResult.Success;
    }
}
