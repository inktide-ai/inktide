namespace Inktide.API.Developer.Application.Interfaces;

public interface IKeycloakClientService
{
    Task<(string KeycloakClientId, string PlainSecret)> CreateClientAsync(
        string appName,
        string[] redirectUris,
        CancellationToken ct);

    Task DeleteClientAsync(string keycloakClientId, CancellationToken ct);

    Task<string> RotateSecretAsync(string keycloakClientId, CancellationToken ct);
}
