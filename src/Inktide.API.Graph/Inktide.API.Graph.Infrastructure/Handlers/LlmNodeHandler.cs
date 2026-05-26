using Inktide.API.Graph.Domain;
using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace Inktide.API.Graph.Infrastructure.Handlers;

/// <summary>
/// Sends the context envelope to an LLM and emits the text response.
/// Resolves the chat completion service from DI using the configured provider_id.
/// </summary>
public sealed class LlmNodeHandler : INodeHandler
{
    public string Type => NodeTypes.Llm;
    public string ProviderId => "core";

    public async Task ExecuteAsync(NodeExecutionContext context, CancellationToken ct)
    {
        var logger     = context.Services.GetLogger<LlmNodeHandler>();
        var providerId = context.GetConfig<string>(ConfigKeys.ProviderId) ?? "ollama";

        IChatCompletionService? chatService = null;
        try
        {
            chatService = context.Services.GetOptional<IChatCompletionService>();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "LlmNode: could not resolve IChatCompletionService for provider '{Provider}'", providerId);
        }

        if (chatService is null)
        {
            logger.LogWarning("LlmNode: no chat completion service available, skipping");
            context.SetOutput("response", string.Empty);
            return;
        }

        var userMessage  = context.GetInput<string>("context") ?? string.Empty;
        var systemPrompt = context.GetConfig<string>(ConfigKeys.SystemPrompt) ?? string.Empty;
        var temperature  = context.GetConfig<double?>(ConfigKeys.Temperature) ?? 0.7;
        var maxTokens    = context.GetConfig<int?>(ConfigKeys.MaxTokens) ?? 512;

        var history = new ChatHistory();
        if (!string.IsNullOrEmpty(systemPrompt))
            history.AddSystemMessage(systemPrompt);
        history.AddUserMessage(userMessage);

        var settings = new PromptExecutionSettings
        {
            ExtensionData = new Dictionary<string, object>
            {
                [ConfigKeys.Temperature] = temperature,
                [ConfigKeys.MaxTokens]   = maxTokens,
            },
        };

        var result = await chatService.GetChatMessageContentAsync(history, settings, cancellationToken: ct);
        context.SetOutput("response", result.Content ?? string.Empty);
    }
}
