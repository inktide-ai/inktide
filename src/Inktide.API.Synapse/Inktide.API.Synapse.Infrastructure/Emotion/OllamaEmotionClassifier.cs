using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Inktide.API.Graph.Application.Interfaces;
using Inktide.API.Graph.Application.Models;
using Inktide.API.Synapse.Application.Configuration;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Inktide.API.Synapse.Infrastructure.Emotion;

/// <summary>
/// Calls Ollama's chat API with JSON mode to classify the emotional reaction
/// an AI character should show in response to a chat message.
///
/// SRP: only responsible for the HTTP call and response parsing.
/// Never throws — returns <see cref="EmotionResult"/> with null emotion on any failure.
/// </summary>
public sealed class OllamaEmotionClassifier : IEmotionClassificationService, IEmotionClassifier
{

    private static readonly string[] ValidEmotions =
        ["angry", "sad", "surprised", "relax", "happy", "blush", "sleepy", "thinking", "excited", "sarcastic"];

    private static readonly string SystemPrompt =
        "You are an emotion classifier for a VTuber AI character. " +
        "Given a chat message, choose the single most fitting emotional REACTION the character should show. " +
        "Respond ONLY with valid JSON matching this schema: " +
        "{\"emotion\": <string|null>, \"intensity\": <number>} " +
        "where emotion is one of: angry, sad, surprised, relax, happy, blush, sleepy, thinking, excited, sarcastic, null. " +
        "Use null if the message requires no strong emotional reaction. " +
        "intensity is a float between 0.0 and 1.0.";

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly HttpClient _http;
    private readonly EmotionClassificationOptions _opts;
    private readonly ILogger<OllamaEmotionClassifier> _logger;


    public OllamaEmotionClassifier(
        HttpClient http,
        IOptions<EmotionClassificationOptions> opts,
        ILogger<OllamaEmotionClassifier> logger)
    {
        _http   = http   ?? throw new ArgumentNullException(nameof(http));
        _opts   = opts?.Value ?? throw new ArgumentNullException(nameof(opts));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        _http.BaseAddress = new Uri(_opts.OllamaBaseUrl.TrimEnd('/') + "/");
        _http.Timeout     = TimeSpan.FromMilliseconds(_opts.TimeoutMs);
    }


    public async Task<EmotionResult> ClassifyAsync(
        string message,
        string? personality,
        CancellationToken ct,
        float intensityScale = 1.0f)
    {
        try
        {
            var userPrompt = string.IsNullOrWhiteSpace(personality)
                ? message
                : $"Character personality: {personality}\n\nChat message: {message}";

            var body = new
            {
                model  = _opts.Model,
                format = "json",
                stream = false,
                messages = new[]
                {
                    new { role = "system", content = SystemPrompt },
                    new { role = "user",   content = userPrompt   },
                },
            };

            using var response = await _http.PostAsJsonAsync("api/chat", body, ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "[EmotionClassifier] Ollama returned {Status} — skipping emotion",
                    response.StatusCode);
                return None;
            }

            var raw = await response.Content.ReadAsStringAsync(ct);
            return ParseResponse(raw, intensityScale);
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("[EmotionClassifier] Timed out ({Ms}ms) — skipping emotion", _opts.TimeoutMs);
            return None;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[EmotionClassifier] Unexpected error — skipping emotion");
            return None;
        }
    }


    private EmotionResult ParseResponse(string raw, float intensityScale = 1.0f)
    {
        try
        {
            // Ollama wraps the model output in { "message": { "content": "..." } }
            using var doc     = JsonDocument.Parse(raw);
            var contentJson   = doc.RootElement
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "{}";

            var parsed = JsonSerializer.Deserialize<EmotionPayload>(contentJson, JsonOpts);
            if (parsed is null) return None;

            var emotion = parsed.Emotion?.ToLowerInvariant();
            if (emotion is not null && !Array.Exists(ValidEmotions, e => e == emotion))
            {
                _logger.LogDebug("[EmotionClassifier] Unknown emotion '{Emotion}' — treating as null", emotion);
                emotion = null;
            }

            var intensity = Math.Clamp(parsed.Intensity * intensityScale, 0f, 1f);
            var result    = new EmotionResult(emotion, intensity);

            _logger.LogDebug("[EmotionClassifier] → emotion={Emotion} intensity={Intensity:F2}", emotion, intensity);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[EmotionClassifier] Failed to parse response — raw: {Raw}", raw[..Math.Min(raw.Length, 200)]);
            return None;
        }
    }


    async Task<EmotionClassification?> IEmotionClassifier.ClassifyAsync(
        string message, string? personality, CancellationToken ct, float intensityScale)
    {
        var result = await ClassifyAsync(message, personality, ct, intensityScale);
        return result.Emotion is not null ? new EmotionClassification(result.Emotion, result.Intensity) : null;
    }

    private static EmotionResult None => new(null, 0f);


    private sealed class EmotionPayload
    {
        [JsonPropertyName("emotion")]   public string? Emotion   { get; set; }
        [JsonPropertyName("intensity")] public float   Intensity { get; set; }
    }

}
