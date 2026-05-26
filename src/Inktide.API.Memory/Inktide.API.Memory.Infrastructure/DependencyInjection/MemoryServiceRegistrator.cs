using Inktide.API.Core;
using Inktide.API.Memory.Domain.Ports;
using Inktide.API.Memory.Infrastructure.Repositories;
using DryIoc;
using Microsoft.Extensions.Configuration;

namespace Inktide.API.Memory.Infrastructure.DependencyInjection;

public sealed class MemoryServiceRegistrator : IServiceRegistrator
{
    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        registrator.Register<MemoryMetadataRepository>(Reuse.Scoped);
        registrator.RegisterMapping<IMemoryMetadataRepository, MemoryMetadataRepository>();
        registrator.RegisterMapping<IMemoryMaintenanceRepository, MemoryMetadataRepository>();
    }
}
