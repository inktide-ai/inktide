using Inktide.API.Core;
using Inktide.API.Memory.Domain.Ports;
using Inktide.API.Memory.Infrastructure.Repositories;
using DryIoc;
using Microsoft.Extensions.Configuration;

namespace Inktide.API.Memory.Infrastructure.DependencyInjection;

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
