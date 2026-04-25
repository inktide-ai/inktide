using DryIoc;

namespace Inktide.API.Deployment;

/// <summary>
/// Scans all loaded assemblies for concrete implementations of <typeparamref name="T"/>
/// and instantiates them via <see cref="Activator.CreateInstance"/>.
/// </summary>
/// <remarks>
/// Call only after all module assemblies have been loaded (i.e. after the module-loading phase
/// in <c>ConfigureAppConfiguration</c>), otherwise implementations in late-loaded assemblies
/// will be missed.
/// </remarks>
internal static class ModuleScanner
{
    internal static IReadOnlyList<T> ResolveAll<T>() where T : class =>
        AppDomain.CurrentDomain.GetAssemblies()
            .Distinct()
            .SelectMany(a => a.DefinedTypes)
            .Where(t => t is { IsClass: true, IsAbstract: false } && t.ImplementsServiceType<T>())
            .Select(t => (T)Activator.CreateInstance(t)!)
            .ToList();
}
