using Inktide.API.Profile.Infrastructure.Settings;
using Inktide.API.Profile.Infrastructure.Settings.Validators;
using Microsoft.Extensions.Hosting;
using NSubstitute;
using Xunit;

namespace Inktide.API.Profile.Infrastructure.Tests;

public sealed class SmtpSettingsValidatorTests
{
    private static SmtpSettingsValidator BuildValidator(bool isProduction)
    {
        var env = Substitute.For<IHostEnvironment>();
        env.EnvironmentName.Returns(isProduction ? Environments.Production : Environments.Development);
        return new SmtpSettingsValidator(env);
    }

    [Fact]
    public void Validate_WhenProductionAndLocalhostHost_ReturnsFail()
    {
        var validator = BuildValidator(isProduction: true);
        var settings = new SmtpSettings { Host = "localhost" };

        var result = validator.Validate(null, settings);

        Assert.True(result.Failed);
        Assert.NotNull(result.FailureMessage);
        Assert.Contains("localhost", result.FailureMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Validate_WhenDevelopmentAndLocalhostHost_ReturnsSuccess()
    {
        var validator = BuildValidator(isProduction: false);
        var settings = new SmtpSettings { Host = "localhost" };

        var result = validator.Validate(null, settings);

        Assert.False(result.Failed);
    }

    [Fact]
    public void Validate_WhenProductionAndRealHost_ReturnsSuccess()
    {
        var validator = BuildValidator(isProduction: true);
        var settings = new SmtpSettings { Host = "smtp.example.com" };

        var result = validator.Validate(null, settings);

        Assert.False(result.Failed);
    }

    [Fact]
    public void Validate_WhenProductionAndEmptyHost_ReturnsSuccess()
    {
        var validator = BuildValidator(isProduction: true);
        var settings = new SmtpSettings { Host = "" };

        var result = validator.Validate(null, settings);

        // Empty host doesn't trigger the localhost check
        Assert.False(result.Failed);
    }
}
