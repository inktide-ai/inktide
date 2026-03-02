using System.ComponentModel.DataAnnotations;

namespace Chimera.ApiGateway.Infrastructure.Settings;

public sealed class ObservabilitySettings
{
    private string _serviceName = "chimera-api-gateway";
    private string _otlpEndpoint = "http://localhost:4317";
    private bool _enableTracing = true;
    private bool _enableMetrics = true;

    [Required(AllowEmptyStrings = false)]
    public string ServiceName
    {
        get => _serviceName;
        set => _serviceName = value;
    }

    [Required(AllowEmptyStrings = false)]
    public string OtlpEndpoint
    {
        get => _otlpEndpoint;
        set => _otlpEndpoint = value;
    }

    public bool EnableTracing
    {
        get => _enableTracing;
        set => _enableTracing = value;
    }

    public bool EnableMetrics
    {
        get => _enableMetrics;
        set => _enableMetrics = value;
    }
}
