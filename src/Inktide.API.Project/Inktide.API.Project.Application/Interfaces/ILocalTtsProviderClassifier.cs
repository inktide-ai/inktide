namespace Inktide.API.Project.Application.Interfaces;

public interface ILocalTtsProviderClassifier
{
    bool IsLocal(string? providerId);
}
