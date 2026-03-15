using Chimera.API.Soul.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Soul.Infrastructure;

public class Prosto : IProsto
{
    private readonly ILogger<Prosto> _logger;
    
    public Prosto(ILogger<Prosto> logger)
    {
        _logger = logger ??  throw new ArgumentNullException(nameof(logger));
    }

    public void Log()
    {
        _logger.Log(LogLevel.Information, "Prosto started");
    }
    
}