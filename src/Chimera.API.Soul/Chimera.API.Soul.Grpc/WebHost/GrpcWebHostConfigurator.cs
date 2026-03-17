using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.Configuration;
using Chimera.API.Core;
using Chimera.API.Soul.Grpc.Settings;

namespace Chimera.API.Soul.Grpc.WebHost;

/// <summary>
/// Configures a dedicated Kestrel HTTP/2 endpoint for Soul gRPC services.
/// Reads settings from the "SoulGrpcServerSettings" configuration section.
/// </summary>
public sealed class GrpcWebHostConfigurator : IWebHostConfigurator
{
    #region Public Methods

    public void Configure(IWebHostBuilder webHostBuilder)
    {
        webHostBuilder.ConfigureKestrel((context, options) =>
        {
            var settings = new GrpcServerSettings();
            context.Configuration
                .GetSection("SoulGrpcServerSettings")
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

    #endregion
}
