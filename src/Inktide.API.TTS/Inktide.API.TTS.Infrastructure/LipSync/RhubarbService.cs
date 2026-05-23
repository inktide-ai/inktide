using Inktide.API.Core.Generators;
using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

namespace Inktide.API.TTS.Infrastructure.LipSync;

/// <summary>
/// Viseme cue for a single Rhubarb mouth shape, serialized to the frontend.
/// </summary>
public sealed record VisemeCue(
    [property: JsonPropertyName("startMs")] int    StartMs,
    [property: JsonPropertyName("viseme")]  string Viseme);

public interface IRhubarbService
{
    bool IsAvailable { get; }

    /// <summary>
    /// Analyses <paramref name="wavBytes"/> and returns a viseme timeline,
    /// or <c>null</c> when Rhubarb is unavailable or analysis fails.
    /// </summary>
    Task<VisemeCue[]?> AnalyzeAsync(byte[] wavBytes, CancellationToken ct = default);
}

/// <summary>
/// Wraps the Rhubarb Lip Sync CLI to produce phoneme-accurate viseme timelines
/// from synthesized WAV audio.
///
/// Auto-detects <c>rhubarb</c> in <c>$PATH</c> at construction time.
/// When unavailable, <see cref="IsAvailable"/> is <c>false</c> and
/// <see cref="AnalyzeAsync"/> returns <c>null</c> — the frontend falls back
/// to real-time formant analysis.
/// </summary>
public sealed class RhubarbService : IRhubarbService
{
    // Rhubarb on a typical 2–3 s TTS clip finishes in < 500 ms; 8 s is generous.
    private static readonly TimeSpan AnalysisTimeout = TimeSpan.FromSeconds(8);

    private static readonly JsonSerializerOptions JsonOpts =
        new() { PropertyNameCaseInsensitive = true };

    private readonly string? _executable;
    private readonly ILogger<RhubarbService> _logger;

    public RhubarbService(ILogger<RhubarbService> logger)
    {
        _logger    = logger ?? throw new ArgumentNullException(nameof(logger));
        _executable = FindInPath("rhubarb");

        if (_executable is not null)
            _logger.LogInformation(
                "Rhubarb found at {Path} — phoneme-accurate lip sync enabled", _executable);
        else
            _logger.LogInformation(
                "rhubarb not in PATH — lip sync will fall back to frontend formant analysis. " +
                "Install from https://github.com/DanielSWolf/rhubarb-lip-sync");
    }

    public bool IsAvailable => _executable is not null;

    public async Task<VisemeCue[]?> AnalyzeAsync(byte[] wavBytes, CancellationToken ct = default)
    {
        if (_executable is null) return null;

        var tmp = Path.Combine(Path.GetTempPath(), $"inktide-rhubarb-{IdGenerator.New():N}.wav");
        try
        {
            await File.WriteAllBytesAsync(tmp, wavBytes, ct);
            return await RunAsync(tmp, ct);
        }
        catch (OperationCanceledException)
        {
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Rhubarb analysis failed — skipping viseme timeline");
            return null;
        }
        finally
        {
            try { File.Delete(tmp); }
            catch (Exception ex) { _logger.LogDebug(ex, "Failed to delete Rhubarb temp file {Path}", tmp); }
        }
    }

    private async Task<VisemeCue[]?> RunAsync(string wavPath, CancellationToken ct)
    {
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(AnalysisTimeout);

        var psi = new ProcessStartInfo
        {
            FileName               = _executable,
            ArgumentList           = { "--machineReadable", "-f", "json", wavPath },
            RedirectStandardOutput = true,
            RedirectStandardError  = true,
            UseShellExecute        = false,
            CreateNoWindow         = true,
        };

        using var proc = Process.Start(psi)
            ?? throw new InvalidOperationException("Failed to start rhubarb process");

        // Read stdout and stderr concurrently to prevent pipe-buffer deadlock.
        var stdoutTask = proc.StandardOutput.ReadToEndAsync(cts.Token);
        var stderrTask = proc.StandardError.ReadToEndAsync(cts.Token);
        await proc.WaitForExitAsync(cts.Token);
        var stdout = await stdoutTask;

        if (proc.ExitCode != 0)
        {
            var stderr = await stderrTask;
            _logger.LogWarning("rhubarb exited {Code}: {Stderr}", proc.ExitCode, stderr);
            return null;
        }

        return ParseOutput(stdout);
    }

    private VisemeCue[]? ParseOutput(string stdout)
    {
        var parsed = JsonSerializer.Deserialize<RhubarbOutput>(stdout, JsonOpts);
        if (parsed?.MouthCues is null) return null;

        return parsed.MouthCues
            .Select(c => new VisemeCue(
                StartMs: (int)(c.Start * 1000),
                Viseme:  c.Value))
            .ToArray();
    }

    private static string? FindInPath(string name)
    {
        var exeName = OperatingSystem.IsWindows() ? $"{name}.exe" : name;
        var path    = Environment.GetEnvironmentVariable("PATH") ?? string.Empty;

        foreach (var dir in path.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            var full = Path.Combine(dir, exeName);
            if (File.Exists(full)) return full;
        }

        return null;
    }

    private sealed record RhubarbOutput(
        [property: JsonPropertyName("metadata")]  RhubarbMetadata  Metadata,
        [property: JsonPropertyName("mouthCues")] List<RhubarbCue> MouthCues);

    private sealed record RhubarbMetadata(
        [property: JsonPropertyName("duration")] double Duration);

    private sealed record RhubarbCue(
        [property: JsonPropertyName("start")] double Start,
        [property: JsonPropertyName("end")]   double End,
        [property: JsonPropertyName("value")] string Value);
}
