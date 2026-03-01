using Microsoft.AspNetCore.Builder;

namespace Chimera.AI.Orchestrator.Core;

/// <summary>
/// Configure the ASP.NET Core middleware pipeline.
/// </summary>
public interface IApplicationConfigurator
{
    void Configure(IApplicationBuilder applicationBuilder);
}
