using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace Inktide.API.Profile.Infrastructure.Settings.Validators;

public sealed class SmtpSettingsValidator : IValidateOptions<SmtpSettings>
{
    private readonly IHostEnvironment _env;

    public SmtpSettingsValidator(IHostEnvironment env) => _env = env;

    public ValidateOptionsResult Validate(string? name, SmtpSettings options)
    {
        if (_env.IsProduction() &&
            !string.IsNullOrWhiteSpace(options.Host) &&
            options.Host.Contains("localhost", StringComparison.OrdinalIgnoreCase))
        {
            return ValidateOptionsResult.Fail(
                "SmtpSettings.Host is set to 'localhost' — override via SMTP_HOST environment variable in production.");
        }

        return ValidateOptionsResult.Success;
    }
}
