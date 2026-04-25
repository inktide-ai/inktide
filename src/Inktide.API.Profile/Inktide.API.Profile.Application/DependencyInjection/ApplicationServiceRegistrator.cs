using Inktide.API.Core;
using DryIoc;
using Microsoft.Extensions.Configuration;

namespace Inktide.API.Profile.Application.DependencyInjection;

/// <summary>
/// Profile application composition root (contracts only; implementations live in Infrastructure).
/// </summary>
public sealed class ApplicationServiceRegistrator : IServiceRegistrator
{

    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
    }

}
