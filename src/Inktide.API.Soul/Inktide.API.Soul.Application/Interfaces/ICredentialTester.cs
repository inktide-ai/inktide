namespace Inktide.API.Soul.Application.Interfaces;

public interface ICredentialTester
{
    Task<CredentialTestResult> TestAsync(
        string providerId,
        string apiKey,
        string? baseUrl,
        string? config,
        CancellationToken ct = default);
}

public sealed record CredentialTestResult(bool Success, string? Error);
