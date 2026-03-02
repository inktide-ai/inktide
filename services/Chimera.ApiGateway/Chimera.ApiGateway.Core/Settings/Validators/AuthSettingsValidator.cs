using Microsoft.Extensions.Options;

namespace Chimera.ApiGateway.Core.Settings.Validators;

/// <summary>Validates <see cref="AuthSettings"/> at application startup.</summary>
public sealed class AuthSettingsValidator : IValidateOptions<AuthSettings>
{
    public ValidateOptionsResult Validate(string? name, AuthSettings options)
    {
        var failures = new List<string>();

        if (string.IsNullOrWhiteSpace(options.Secret) || options.Secret.Length < 32)
        {
            failures.Add("AuthSettings.Secret must be at least 32 characters. Set via User Secrets or an environment variable.");
        }

        if (string.IsNullOrWhiteSpace(options.Issuer))
        {
            failures.Add("AuthSettings.Issuer is required.");
        }

        if (string.IsNullOrWhiteSpace(options.Audience))
        {
            failures.Add("AuthSettings.Audience is required.");
        }

        if (options.AccessTokenMinutes <= 0)
        {
            failures.Add("AuthSettings.AccessTokenMinutes must be greater than zero.");
        }

        if (options.RefreshTokenDays <= 0)
        {
            failures.Add("AuthSettings.RefreshTokenDays must be greater than zero.");
        }

        if (options.BcryptWorkFactor is < 4 or > 31)
        {
            failures.Add("AuthSettings.BcryptWorkFactor must be between 4 and 31.");
        }

        return failures.Count > 0
            ? ValidateOptionsResult.Fail(failures)
            : ValidateOptionsResult.Success;
    }
}
