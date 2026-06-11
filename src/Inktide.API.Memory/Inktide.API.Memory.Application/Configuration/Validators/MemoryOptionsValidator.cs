using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace Inktide.API.Memory.Application.Configuration.Validators;

public sealed class MemoryOptionsValidator : IValidateOptions<MemoryOptions>
{
    private readonly IHostEnvironment _env;

    public MemoryOptionsValidator(IHostEnvironment env) => _env = env;

    public ValidateOptionsResult Validate(string? name, MemoryOptions options)
    {
        if (_env.IsProduction() &&
            options.ScribeBaseUrl.Contains("localhost", StringComparison.OrdinalIgnoreCase))
        {
            return ValidateOptionsResult.Fail(
                "MemoryOptions.ScribeBaseUrl contains 'localhost' — set Memory__ScribeBaseUrl in production.");
        }

        return ValidateOptionsResult.Success;
    }
}
