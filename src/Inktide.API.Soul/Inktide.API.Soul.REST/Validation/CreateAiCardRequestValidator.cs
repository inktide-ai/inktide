using Inktide.API.Soul.REST.Models;
using FluentValidation;

namespace Inktide.API.Soul.REST.Validation;

public sealed class CreateAiCardRequestValidator : AbstractValidator<CreateAiCardRequest>
{
    private static readonly string[] ValidStressBehaviors = ["deflect", "humor", "withdraw", "confront"];
    private static readonly string[] ValidBaselineMoods   = ["neutral", "happy", "chill", "melancholic", "hyped"];

    public CreateAiCardRequestValidator()
    {
        // ── Core fields ────────────────────────────────────────────────────────

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(100);

        RuleFor(x => x.SystemPrompt)
            .NotEmpty().WithMessage("System prompt is required.")
            .MaximumLength(10_000);

        RuleFor(x => x.LlmCatalogId)
            .NotEmpty().WithMessage("LLM model selection is required.");

        RuleFor(x => x.Personality)
            .MaximumLength(1000);

        // ── URL format (SSRF prevention) ───────────────────────────────────────

        RuleFor(x => x.AvatarUrl)
            .Must(IsValidHttpUrl)
            .When(x => x.AvatarUrl is not null)
            .WithMessage("avatar_url must be a valid HTTP/HTTPS URL.");

        // ── LLM config ─────────────────────────────────────────────────────────

        When(x => x.LlmConfig is not null, () =>
        {
            RuleFor(x => x.LlmConfig!.Temperature).InclusiveBetween(0.0, 2.0);
            RuleFor(x => x.LlmConfig!.TopP).InclusiveBetween(0.0, 1.0);
            RuleFor(x => x.LlmConfig!.MaxTokens).InclusiveBetween(1, 128_000);
            RuleFor(x => x.LlmConfig!.FrequencyPenalty).InclusiveBetween(-2.0, 2.0);
            RuleFor(x => x.LlmConfig!.PresencePenalty).InclusiveBetween(-2.0, 2.0);

            RuleFor(x => x.LlmConfig!.BaseUrl)
                .Must(IsValidHttpsUrl)
                .When(x => x.LlmConfig!.BaseUrl is not null)
                .WithMessage("llm_config.base_url must be a valid HTTPS URL.");
        });

        // ── TTS config ─────────────────────────────────────────────────────────

        When(x => x.TtsConfig is not null, () =>
        {
            RuleFor(x => x.TtsConfig!.Speed).InclusiveBetween(0.1, 4.0);
            RuleFor(x => x.TtsConfig!.Pitch).InclusiveBetween(-50.0, 50.0);
            RuleFor(x => x.TtsConfig!.Volume).InclusiveBetween(-50.0, 50.0);
            RuleFor(x => x.TtsConfig!.Stability).InclusiveBetween(0.0, 1.0);
            RuleFor(x => x.TtsConfig!.SimilarityBoost).InclusiveBetween(0.0, 1.0);
            RuleFor(x => x.TtsConfig!.Style).InclusiveBetween(0.0, 1.0);

            RuleFor(x => x.TtsConfig!.BaseUrl)
                .Must(IsValidHttpsUrl)
                .When(x => x.TtsConfig!.BaseUrl is not null)
                .WithMessage("tts_config.base_url must be a valid HTTPS URL.");
        });

        // ── Response behavior ──────────────────────────────────────────────────

        When(x => x.ResponseBehavior is not null, () =>
        {
            RuleFor(x => x.ResponseBehavior!.ResponseDelayMs).InclusiveBetween(0, 30_000);
            RuleFor(x => x.ResponseBehavior!.MaxResponseLength).InclusiveBetween(1, 4_000);
            RuleFor(x => x.ResponseBehavior!.EmotionIntensityScale).InclusiveBetween(0.0, 5.0);
        });

        // ── Memory settings ────────────────────────────────────────────────────

        When(x => x.MemorySettings is not null, () =>
        {
            RuleFor(x => x.MemorySettings!.MaxMemories).InclusiveBetween(1, 10_000);
            RuleFor(x => x.MemorySettings!.RetentionDays).InclusiveBetween(1, 3_650);
            RuleFor(x => x.MemorySettings!.ImportanceThreshold).InclusiveBetween(0.0, 1.0);
        });

        // ── AutoPilot ──────────────────────────────────────────────────────────

        When(x => x.AutoPilot is not null, () =>
        {
            RuleFor(x => x.AutoPilot!.IdleTimeoutSeconds).InclusiveBetween(30, 86_400);
            RuleFor(x => x.AutoPilot!.MinIntervalSeconds).InclusiveBetween(10, 3_600);
        });

        // ── Personality config ─────────────────────────────────────────────────

        When(x => x.PersonalityConfig is not null, () =>
        {
            RuleFor(x => x.PersonalityConfig!.Warmth).InclusiveBetween(0.0, 1.0);
            RuleFor(x => x.PersonalityConfig!.Playfulness).InclusiveBetween(0.0, 1.0);
            RuleFor(x => x.PersonalityConfig!.Assertiveness).InclusiveBetween(0.0, 1.0);
            RuleFor(x => x.PersonalityConfig!.Empathy).InclusiveBetween(0.0, 1.0);
            RuleFor(x => x.PersonalityConfig!.Formality).InclusiveBetween(0.0, 1.0);
            RuleFor(x => x.PersonalityConfig!.Sarcasm).InclusiveBetween(0.0, 1.0);
            RuleFor(x => x.PersonalityConfig!.EmotionVolatility).InclusiveBetween(0.0, 1.0);
            RuleFor(x => x.PersonalityConfig!.EmotionResponsiveness).InclusiveBetween(0.0, 1.0);
            RuleFor(x => x.PersonalityConfig!.EmotionMemory).InclusiveBetween(0.0, 1.0);

            RuleFor(x => x.PersonalityConfig!.StressBehavior)
                .Must(v => ValidStressBehaviors.Contains(v))
                .WithMessage($"stress_behavior must be one of: {string.Join(", ", ValidStressBehaviors)}.");

            RuleFor(x => x.PersonalityConfig!.BaselineMood)
                .Must(v => ValidBaselineMoods.Contains(v))
                .WithMessage($"baseline_mood must be one of: {string.Join(", ", ValidBaselineMoods)}.");
        });
    }

    private static bool IsValidHttpUrl(string? url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var u)
        && (u.Scheme == Uri.UriSchemeHttp || u.Scheme == Uri.UriSchemeHttps);

    private static bool IsValidHttpsUrl(string? url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var u)
        && u.Scheme == Uri.UriSchemeHttps;
}
