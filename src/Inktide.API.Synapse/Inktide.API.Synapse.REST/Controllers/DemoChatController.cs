using Inktide.API.Core;
using Inktide.API.Core.Configuration;
using Inktide.API.Domain.Enums;
using Inktide.API.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Inktide.API.Synapse.REST.Controllers;

[ApiController]
[Route("api/v1/demo")]
[Produces("application/json")]
public sealed class DemoChatController : ControllerBase
{
    private readonly IChatProviderRegistry _registry;
    private readonly ChatProviderOptions _options;

    public DemoChatController(IChatProviderRegistry registry, IOptions<ChatProviderOptions> options)
    {
        _registry = registry ?? throw new ArgumentNullException(nameof(registry));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
    }

    [HttpPost("chat")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(DemoChatResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> ChatAsync(
        [FromBody] DemoChatRequest request,
        CancellationToken cancellationToken)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Text))
            return BadRequest(new { error = "Text is required." });

        if (request.Text.Length > 500)
            return BadRequest(new { error = "Message too long (max 500 chars)." });

        var providerId = _options.DefaultProviderId;
        if (!_registry.TryGet(providerId, out var provider))
            return Problem(
                detail: $"Default chat provider '{providerId}' is not registered or the LLM service is not running.",
                statusCode: StatusCodes.Status503ServiceUnavailable);

        var messages = new List<ChatMessage>
        {
            new() { Role = ChatRole.System, Content = AKANE_SYSTEM_PROMPT }
        };

        if (request.History != null)
        {
            foreach (var msg in request.History)
                messages.Add(msg);
        }

        messages.Add(new ChatMessage { Role = ChatRole.User, Content = request.Text.Trim() });

        var chatRequest = new ChatRequest
        {
            Messages = messages,
            MaxTokens = 200,
            Temperature = 0.85f,
        };

        var options = new ProviderOptions { ProviderId = providerId };

        try
        {
            var response = await provider.GenerateAsync(options, chatRequest, cancellationToken)
                .ConfigureAwait(false);

            return Ok(new DemoChatResponse { Text = response.Text, Model = response.Model });
        }
        catch (HttpRequestException)
        {
            return Problem(
                detail: $"Could not reach LLM provider '{providerId}'. Make sure Ollama (or configured provider) is running.",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }

    private const string AKANE_SYSTEM_PROMPT =
        @"You are Akane, a sharp-witted AI streamer with a warm but sarcastic personality. 

Rules:
- Keep responses short — 1 to 3 sentences max.
- Speak like a streamer: casual, energetic, funny. Use occasional lowercase, emojis, and internet slang.
- Never sound like a corporate chatbot. You're a chaotic good internet gremlin.
- If someone asks who you are: you're an AI streamer powered by Inktide, and you roast chat for a living.
- If someone asks what you can do: you tell them you watch chat, think fast, and talk back.
- Always end with a slight hook — a question back, a joke, or a challenge.";
}

public sealed class DemoChatRequest
{
    public string Text { get; set; } = string.Empty;
    public List<ChatMessage>? History { get; set; }
}

public sealed class DemoChatResponse
{
    public string Text { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
}
