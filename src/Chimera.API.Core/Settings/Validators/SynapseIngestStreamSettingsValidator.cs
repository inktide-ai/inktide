using Microsoft.Extensions.Options;

namespace Chimera.API.Core.Settings.Validators;

/// <summary>Validates <see cref="SynapseIngestStreamSettings"/> at startup.</summary>
public sealed class SynapseIngestStreamSettingsValidator : IValidateOptions<SynapseIngestStreamSettings>
{
    #region Public Methods

    public ValidateOptionsResult Validate(string? name, SynapseIngestStreamSettings options)
    {
        var failures = new List<string>();

        if (string.IsNullOrWhiteSpace(options.StreamName))
        {
            failures.Add("SynapseIngestStreamSettings.StreamName is required.");
        }

        if (string.IsNullOrWhiteSpace(options.ConsumerGroup))
        {
            failures.Add("SynapseIngestStreamSettings.ConsumerGroup is required.");
        }

        if (string.IsNullOrWhiteSpace(options.ConsumerNamePrefix))
        {
            failures.Add("SynapseIngestStreamSettings.ConsumerNamePrefix is required.");
        }

        if (string.IsNullOrWhiteSpace(options.PayloadFieldName))
        {
            failures.Add("SynapseIngestStreamSettings.PayloadFieldName is required.");
        }

        if (options.ApproximateMaxLength < 1)
        {
            failures.Add("SynapseIngestStreamSettings.ApproximateMaxLength must be at least 1.");
        }

        if (options.ReadBlockMilliseconds < 0)
        {
            failures.Add("SynapseIngestStreamSettings.ReadBlockMilliseconds must be non-negative.");
        }

        if (options.ReadCount < 1)
        {
            failures.Add("SynapseIngestStreamSettings.ReadCount must be at least 1.");
        }

        if (options.AutoClaimMinIdleMs < 1)
        {
            failures.Add("SynapseIngestStreamSettings.AutoClaimMinIdleMs must be at least 1.");
        }

        if (options.AutoClaimBatchSize < 1)
        {
            failures.Add("SynapseIngestStreamSettings.AutoClaimBatchSize must be at least 1.");
        }

        if (options.AutoClaimLoopDelaySeconds < 1)
        {
            failures.Add("SynapseIngestStreamSettings.AutoClaimLoopDelaySeconds must be at least 1.");
        }

        return failures.Count > 0
            ? ValidateOptionsResult.Fail(failures)
            : ValidateOptionsResult.Success;
    }

    #endregion
}
