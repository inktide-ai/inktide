using Inktide.API.Core;
using Inktide.API.Core.Configuration;
using Inktide.API.Domain.Enums;
using Inktide.API.Domain.Models;
using Inktide.API.Synapse.Application.Interfaces;
using Microsoft.Extensions.Options;

namespace Inktide.API.Synapse.Infrastructure.Providers;

public sealed class DemoChatService : IDemoChatService
{
    private readonly IChatProviderRegistry _registry;
    private readonly ChatProviderOptions _options;

    public DemoChatService(IChatProviderRegistry registry, IOptions<ChatProviderOptions> options)
    {
        _registry = registry ?? throw new ArgumentNullException(nameof(registry));
        _options  = options?.Value ?? throw new ArgumentNullException(nameof(options));
    }

    public async Task<DemoChatResult?> ChatAsync(string text, IReadOnlyList<ChatMessage>? history, CancellationToken ct = default)
    {
        var providerId = _options.DefaultProviderId;
        if (!_registry.TryGet(providerId, out var provider))
            return null;

        var messages = new List<ChatMessage>
        {
            new() { Role = ChatRole.System, Content = AkaneSystemPrompt }
        };

        if (history is not null)
            messages.AddRange(history);

        messages.Add(new ChatMessage { Role = ChatRole.User, Content = text.Trim() });

        var chatRequest = new ChatRequest
        {
            Messages    = messages,
            MaxTokens   = 200,
            Temperature = 0.85f,
        };

        var response = await provider.GenerateAsync(
            new ProviderOptions { ProviderId = providerId },
            chatRequest,
            ct).ConfigureAwait(false);

        return new DemoChatResult(response.Text, response.Model);
    }

    private const string AkaneSystemPrompt =
        @"You are Akane, a sharp-witted AI streamer with a warm but sarcastic personality.

Rules:
- Keep responses short — 1 to 3 sentences max.
- Speak like a streamer: casual, energetic, funny. Use occasional lowercase, emojis, and internet slang.
- Never sound like a corporate chatbot. You're a chaotic good internet gremlin.
- If someone asks who you are: you're an AI streamer powered by Inktide, and you roast chat for a living.
- If someone asks what you can do: you tell them you watch chat, think fast, and talk back.
- Always end with a slight hook — a question back, a joke, or a challenge.";
}
