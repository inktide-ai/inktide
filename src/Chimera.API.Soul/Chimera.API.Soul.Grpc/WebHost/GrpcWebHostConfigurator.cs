using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.Configuration;
using Chimera.API.Core;
using Chimera.API.Soul.Grpc.Settings;

namespace Chimera.API.Soul.Grpc.WebHost;

/// <summary>
/// Configures a dedicated Kestrel HTTP/2 endpoint for Soul gRPC services.
/// Reads settings from the <c>SoulGrpcServerSettings</c> configuration section.
/// </summary>
public sealed class GrpcWebHostConfigurator : IWebHostConfigurator
{

    public void Configure(IWebHostBuilder webHostBuilder)
    {
        webHostBuilder.ConfigureKestrel((context, options) =>
        {
            var settings = new SoulGrpcServerSettings();
            context.Configuration
                .GetSection(nameof(SoulGrpcServerSettings))
                .Bind(settings);

            if (settings.ListenPort == 0)
            {
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
                        listenOptions.UseHttps(settings.CertPath, settings.CertPassword);
                    }
                });
        });
    }

}
