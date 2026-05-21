using Inktide.API.Synapse.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Synapse.REST.Controllers;

[ApiController]
[Route("api/v1/stats")]
[Produces("application/json")]
public sealed class StatsController : ControllerBase
{
    private readonly ISynapseStatsPort _stats;

    public StatsController(ISynapseStatsPort stats)
    {
        _stats = stats ?? throw new ArgumentNullException(nameof(stats));
    }

    [HttpGet("dashboard")]
    [Authorize]
    [ProducesResponseType(typeof(DashboardStats), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardAsync(CancellationToken cancellationToken)
    {
        var result = await _stats.GetAsync(cancellationToken);
        return Ok(new DashboardStats
        {
            TotalMemories   = result.TotalMemories,
            MonthlyApiCalls = result.MonthlyApiCalls,
        });
    }
}

public sealed class DashboardStats
{
    public int TotalMemories { get; set; }
    public int MonthlyApiCalls { get; set; }
}
