using Inktide.API.Core;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.REST.Services;
using DryIoc;
using Microsoft.Extensions.Configuration;

namespace Inktide.API.Soul.REST;

public sealed class ServiceRegistrator : IServiceRegistrator
{

    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        registrator.Register<IAiCardExportService, AiCardExportService>(Reuse.Scoped);
    }

}
