using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.Configuration;
using Chimera.Identity.API.Core;
using Chimera.Identity.API.REST.Settings;

namespace Chimera.Identity.API.REST;

public class WebHostConfigurator : IWebHostConfigurator
{
    public void Configure(IWebHostBuilder webHostBuilder)
    {
        webHostBuilder
            .ConfigureKestrel((context, options) =>
            {
                var serverSettings = new ServerSettings
                {
                    ListenAddress = "127.0.0.1",
                    ListenPort = 8080
                };
                context.Configuration.Bind("Server", serverSettings);

                options.Limits.MaxRequestBodySize = serverSettings.MaxRequestBodySizeBytes;
                if (serverSettings.MaxConcurrentConnections > 0) {
                    options.Limits.MaxConcurrentConnections = serverSettings.MaxConcurrentConnections;
                }
                options.Limits.MaxConcurrentUpgradedConnections = serverSettings.MaxConcurrentUpgradedConnections;
                if (serverSettings.KeepAliveTimeoutSeconds > 0) {
                    options.Limits.KeepAliveTimeout = TimeSpan.FromSeconds(serverSettings.KeepAliveTimeoutSeconds);
                }
                if (serverSettings.RequestHeadersTimeoutSeconds > 0) {
                    options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(serverSettings.RequestHeadersTimeoutSeconds);
                }

                options.Listen(
                    IPAddress.Parse(serverSettings.ListenAddress),
                    serverSettings.ListenPort,
                    listenOptions =>
                    {
                        listenOptions.Protocols = HttpProtocols.Http1;
                    });
            });
    }
    
}