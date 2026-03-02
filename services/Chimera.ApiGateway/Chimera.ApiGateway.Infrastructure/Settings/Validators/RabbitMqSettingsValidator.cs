using Microsoft.Extensions.Options;

namespace Chimera.ApiGateway.Infrastructure.Settings.Validators;

/// <summary>Validates <see cref="RabbitMqSettings"/> at application startup.</summary>
public sealed class RabbitMqSettingsValidator : IValidateOptions<RabbitMqSettings>
{
    public ValidateOptionsResult Validate(string? name, RabbitMqSettings options)
    {
        var failures = new List<string>();

        if (string.IsNullOrWhiteSpace(options.Host))
        {
            failures.Add("RabbitMqSettings.Host is required.");
        }

        if (options.Port is <= 0 or > 65535)
        {
            failures.Add("RabbitMqSettings.Port must be a valid port (1–65535).");
        }

        if (string.IsNullOrWhiteSpace(options.Exchange))
        {
            failures.Add("RabbitMqSettings.Exchange is required.");
        }

        if (string.IsNullOrWhiteSpace(options.QueueName))
        {
            failures.Add("RabbitMqSettings.QueueName is required.");
        }

        if (string.IsNullOrWhiteSpace(options.RoutingKey))
        {
            failures.Add("RabbitMqSettings.RoutingKey is required.");
        }

        return failures.Count > 0
            ? ValidateOptionsResult.Fail(failures)
            : ValidateOptionsResult.Success;
    }
}
