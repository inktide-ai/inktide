using Inktide.API.Core;
using Inktide.API.Realtime.Infrastructure.Hubs;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace Inktide.API.Realtime.Infrastructure.DependencyInjection;

/// <summary>Maps the SignalR <see cref="AudioHub"/> endpoint at <c>/hubs/audio</c>.</summary>
public sealed class RealtimeEndpointConfigurator : IEndpointConfigurator
{
    public void Map(IEndpointRouteBuilder endpoints)
        => endpoints.MapHub<AudioHub>("/hubs/audio");
}
