namespace Inktide.API.Soul.Application.Interfaces;

public interface IAiCardSlugService
{
    Task<string> GenerateUniqueAsync(string name, Func<string, Task<bool>> existsAsync, CancellationToken ct = default);
}
