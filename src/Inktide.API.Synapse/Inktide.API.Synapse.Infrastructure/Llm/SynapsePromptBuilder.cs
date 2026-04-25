using Inktide.API.Synapse.Application.Models;
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


    public static ChatHistory Build(SynapseAggregatedEnvelope envelope)
    {
        var history = new ChatHistory();
        history.AddSystemMessage(BuildSystem(envelope));

        // Inject conversation history between system and current user message.
        var session = envelope.Session;
        if (session is { History.Count: > 0 })
        {
            foreach (var turn in session.History)
            {
                history.AddUserMessage(turn.UserMessage);
                history.AddAssistantMessage(turn.AssistantReply);
            }
        }

        history.AddUserMessage(BuildUser(envelope));
        return history;
    }


    private static string BuildSystem(SynapseAggregatedEnvelope envelope)
    {
        var ctx = envelope.Context;
        if (ctx is null)
            return "You are a helpful AI assistant.";

        var parts = new List<string>(4);

        // Language override — highest priority, injected first so the model sees it before anything else.
        if (!string.IsNullOrEmpty(ctx.Language))
        {
            var langName = LanguageNames.GetValueOrDefault(ctx.Language, ctx.Language);
            parts.Add(
                $"CRITICAL INSTRUCTION: You MUST respond exclusively in {langName}. " +
                "This rule overrides everything else in this prompt, including the character's voice, style, " +
                "and any language used in the system prompt. " +
                "Never switch to another language under any circumstances.");
        }

        parts.Add(ctx.SystemPrompt);

        // RAG memories
        var memories = envelope.Rag?.Memories;
        if (memories is { Count: > 0 })
        {
            var memLines = string.Join("\n", memories.Select(m => $"- {m.FactText}"));
            parts.Add($"Relevant context from memory:\n{memLines}");
        }

        if (!string.IsNullOrEmpty(ctx.Personality))
            parts.Add(ctx.Personality);

        return string.Join("\n\n", parts);
    }


    private static string BuildUser(SynapseAggregatedEnvelope envelope)
        => $"{envelope.Message.Sender.UserName}: {envelope.Message.Text}";

}
