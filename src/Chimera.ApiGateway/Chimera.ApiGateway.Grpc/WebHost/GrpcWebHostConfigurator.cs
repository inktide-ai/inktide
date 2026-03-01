using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.Configuration;
using Chimera.ApiGateway.Core;
using Chimera.ApiGateway.Grpc.Settings;

namespace Chimera.ApiGateway.Grpc.WebHost;

/// <summary>
/// Configures gRPC endpoint (HTTP/2) for all gRPC services.
/// </summary>
public sealed class GrpcWebHostConfigurator : IWebHostConfigurator
{
    public void Configure(IWebHostBuilder webHostBuilder)
    {
        webHostBuilder.ConfigureKestrel((context, options) =>
        {
            var settings = new GrpcServerSettings();
            context.Configuration.GetSection(nameof(GrpcServerSettings)).Bind(settings);

            if (settings.ListenPort == 0) {
                return;
            }

            options.Listen(
                IPAddress.Parse(settings.ListenAddress),
                settings.ListenPort,
                listenOptions =>
                {
                    listenOptions.Protocols = HttpProtocols.Http2;
                    
                    if (!string.IsNullOrEmpty(settings.CertPath))
                    {
                        listenOptions.UseHttps(
                            settings.CertPath, 
                            settings.CertPassword);
                    }
                  
                });
        });
    }
}
