namespace Inktide.API.Project.Infrastructure.Services;

internal static class FeatureTagWarnings
{
    private static readonly (string Prefix, Func<string, string> Message)[] Handlers =
    [
        ("tts:local:", tag => $"This project uses a local TTS provider ({tag.Split(':').Last()}) which must be installed and running."),
    ];

    public static IEnumerable<string> Resolve(IEnumerable<string> features) =>
        features.SelectMany(f =>
            Handlers
                .Where(h => f.StartsWith(h.Prefix, StringComparison.OrdinalIgnoreCase))
                .Select(h => h.Message(f)));
}
