using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Inktide.API.Core;
using Inktide.API.Soul.Grpc.Settings;

namespace Inktide.API.Soul.Grpc.WebHost;

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

            if (context.HostingEnvironment.IsProduction() && string.IsNullOrEmpty(settings.CertPath))
                throw new InvalidOperationException(
                    "SoulGrpcServerSettings.CertPath must be configured in production. " +
                    "gRPC must use TLS. Set via SoulGrpcServerSettings__CertPath.");

            if (!IPAddress.TryParse(settings.ListenAddress, out var listenAddress))
                throw new InvalidOperationException(
                    $"SoulGrpcServerSettings.ListenAddress '{settings.ListenAddress}' is not a valid IP address. " +
                    "Set via SoulGrpcServerSettings__ListenAddress.");

            options.Listen(
                listenAddress,
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
