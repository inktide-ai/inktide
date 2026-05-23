using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Llm.Sections;
using Microsoft.SemanticKernel.ChatCompletion;

namespace Inktide.API.Synapse.Infrastructure.Llm;

/// <summary>
/// Builds a <see cref="ChatHistory"/> from a <see cref="SynapseAggregatedEnvelope"/>.
/// Port of fast-api/ai-worker/llm-worker/app/prompt/builder.py.
/// </summary>
public static class SynapsePromptBuilder
{
    private static readonly Dictionary<string, string> LanguageNames = new(StringComparer.OrdinalIgnoreCase)
    {
        ["ru"] = "Russian",  ["en"] = "English",  ["de"] = "German",
        ["fr"] = "French",   ["es"] = "Spanish",  ["ja"] = "Japanese",
        ["zh"] = "Chinese",  ["uk"] = "Ukrainian",
    };

    private static readonly IReadOnlyList<IPromptSection> Sections =
    [
        new RagContextSection(),
        new PersonalitySection(),
        new EmotionSection(),
        new ScreenAwarenessSection(),
        new WebhookContextSection(),
    ];


    public static ChatHistory Build(SynapseAggregatedEnvelope envelope)
    {
        var history = new ChatHistory();
        history.AddSystemMessage(BuildSystem(envelope));

        var session = envelope.Session;
        if (session is { History.Count: > 0 })
        {
            foreach (var turn in session.History)
            {
                history.AddUserMessage(turn.UserMessage);
                history.AddAssistantMessage(turn.AssistantReply);
            }
        }

        history.AddUserMessage($"{envelope.Message.Sender.UserName}: {envelope.Message.Text}");
        return history;
    }


    private static string BuildSystem(SynapseAggregatedEnvelope envelope)
    {
        var ctx = envelope.Context;
        if (ctx is null)
            return "You are a helpful AI assistant.";

        var parts = new List<string>(8) { BuildLanguageDirective(ctx.Language), ctx.SystemPrompt };

        foreach (var section in Sections)
        {
            var text = section.Build(envelope);
            if (text is not null) parts.Add(text);
        }

        return string.Join("\n\n", parts.Where(p => !string.IsNullOrEmpty(p)));
    }


    private static string? BuildLanguageDirective(string? language)
    {
        if (string.IsNullOrEmpty(language)) return null;
        var langName = LanguageNames.GetValueOrDefault(language, language);
        return
            $"CRITICAL INSTRUCTION: You MUST respond exclusively in {langName}. " +
            "This rule overrides everything else in this prompt, including the character's voice, style, " +
            "and any language used in the system prompt. " +
            "Never switch to another language under any circumstances.";
    }
}
