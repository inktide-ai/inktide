using Inktide.API.Graph.Domain.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace Inktide.API.Graph.Infrastructure.Execution;

internal sealed class HandlerServices : IHandlerServices
{
    private readonly IServiceProvider _sp;

    public HandlerServices(IServiceProvider sp) => _sp = sp;

    public ILogger<T> GetLogger<T>() =>
        _sp.GetService<ILogger<T>>() ?? NullLogger<T>.Instance;

    public T? GetOptional<T>() where T : class => _sp.GetService<T>();

    public T GetRequired<T>() where T : class => _sp.GetRequiredService<T>();
}
