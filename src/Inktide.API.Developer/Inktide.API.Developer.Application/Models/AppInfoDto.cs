namespace Inktide.API.Developer.Application.Models;

public sealed record AppInfoDto(
    string AppName,
    string? IconUrl,
    string DeveloperName,
    IReadOnlyList<ScopeDescription> RequestedScopes);

public sealed record ScopeDescription(string Scope, string Description);
