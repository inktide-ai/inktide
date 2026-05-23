namespace Inktide.API.Project.Domain.ValueObjects;

public sealed record ProjectPlugin(
    string PluginId,
    bool IsEnabled,
    Dictionary<string, string> Config);
