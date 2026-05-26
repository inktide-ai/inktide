using Microsoft.Extensions.Logging;

namespace Inktide.API.Graph.Domain.Models;

public interface IHandlerServices
{
    ILogger<T> GetLogger<T>();
    T? GetOptional<T>() where T : class;
    T GetRequired<T>() where T : class;
}
