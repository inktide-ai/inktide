namespace Inktide.API.Settings;

internal sealed class ModuleInfo
{
    // Bound from the "Modules" configuration section; a module entry without an
    // assembly name is inert rather than a null-reference hazard at startup.
    public string AssemblyName { get; set; } = string.Empty;

    public bool Enabled { get; set; }
}