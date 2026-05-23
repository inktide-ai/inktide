using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel.ChatCompletion;

namespace Inktide.API.Graph.Infrastructure.Handlers;

/// <summary>
/// Level-1 custom plugin: transforms text using a user-defined prompt template.
/// Template syntax: use {{input}} as the placeholder for the incoming text.
/// </summary>
public sealed class PromptNodeHandler : INodeHandler
{
    public string Type => "plugin";
    public string ProviderId => "prompt";

    public async Task ExecuteAsync(NodeExecutionContext context, CancellationToken ct)
    {
        var logger = context.Services.GetService<ILogger<PromptNodeHandler>>();
        var template = context.GetConfig<string>("template") ?? "{{input}}";
        var inputText = context.GetInput<string>("text") ?? context.GetInput<string>("context") ?? string.Empty;

        var prompt = template.Replace("{{input}}", inputText, StringComparison.OrdinalIgnoreCase);

        var chatService = context.Services.GetService<IChatCompletionService>();
        if (chatService is null)
        {
            logger?.LogWarning("PromptNode: no IChatCompletionService available — returning prompt as-is");
            context.SetOutput("text", prompt);
            return;
        }

        var history = new ChatHistory();
        history.AddUserMessage(prompt);

        var result = await chatService.GetChatMessageContentAsync(history, cancellationToken: ct);
        context.SetOutput("text", result.Content ?? string.Empty);
    }
}
