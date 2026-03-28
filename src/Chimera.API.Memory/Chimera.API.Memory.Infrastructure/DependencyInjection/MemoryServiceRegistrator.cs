using Chimera.API.Core;
using Chimera.API.Memory.Domain.Ports;
using Chimera.API.Memory.Infrastructure.Repositories;
using DryIoc;
using Microsoft.Extensions.Configuration;

namespace Chimera.API.Memory.Infrastructure.DependencyInjection;

/// <summary>
/// Registers scoped services (those that depend on <c>SoulDbContext</c>) into DryIoc.
/// </summary>
public sealed class MemoryServiceRegistrator : IServiceRegistrator
{
    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        // IMemoryMetadataRepository is Scoped because SoulDbContext is Scoped
        registrator.Register<IMemoryMetadataRepository, MemoryMetadataRepository>(Reuse.Scoped);
    }
}
