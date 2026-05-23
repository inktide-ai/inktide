using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;

namespace Inktide.API.Graph.Domain.Providers;

/// <summary>
/// Runs the context envelope through a language model and emits the generated text response.
/// Backed by Semantic Kernel; the provider_id config selects the concrete backend.
/// </summary>
public sealed class LlmNodeProvider : INodeProvider
{
    public string Type => "llm";
    public string ProviderId => "core";

    public NodeDefinition GetDefinition() => new(
        Type: Type,
        ProviderId: ProviderId,
        Label: "LLM",
        Description: "Generates a text response from the context envelope via a language model.",
        Inputs:
        [
            new Port("context", "context", "Enriched context from Input / plugins"),
        ],
        Outputs:
        [
            new Port("response", "text", "Generated text response"),
        ],
        ConfigSchema: new Dictionary<string, ConfigFieldSchema>
        {
            ["provider_id"] = new("select",
                Default: "ollama",
                Description: "LLM backend",
                Options: ["ollama", "openai", "custom"]),

            ["model_id"] = new("string",
                Default: "",
                Description: "Model identifier (e.g. llama3, gpt-4o)"),

            ["temperature"] = new("number",
                Default: 0.7,
                Description: "Sampling temperature — higher = more creative"),

            ["max_tokens"] = new("number",
                Default: 512,
                Description: "Maximum tokens in the completion"),

            ["system_prompt_override"] = new("string",
                Default: "",
                Description: "Replaces the soul's system prompt when non-empty"),
        });
}
