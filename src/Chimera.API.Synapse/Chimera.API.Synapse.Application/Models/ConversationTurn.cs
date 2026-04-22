namespace Chimera.API.Synapse.Application.Models;

/// <summary>One completed exchange: a user message and the AI's reply.</summary>
public sealed record ConversationTurn(string UserMessage, string AssistantReply);
