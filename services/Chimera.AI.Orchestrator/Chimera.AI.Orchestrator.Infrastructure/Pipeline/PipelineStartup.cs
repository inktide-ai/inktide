using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Chimera.AI.Orchestrator.Application.Interfaces;
using Chimera.AI.Orchestrator.Application.Models;
using Chimera.AI.Orchestrator.Application.Pipeline;
using Chimera.AI.Orchestrator.Core;
using Chimera.AI.Orchestrator.Infrastructure.Pipeline.Steps;

namespace Chimera.AI.Orchestrator.Infrastructure.Pipeline;

/// <summary>
/// Registers all pipeline steps and assembles the message processing pipeline.
/// Steps are added in execution order — changing order here changes the pipeline.
/// </summary>
public sealed class PipelineStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddSingleton<MessageAnalysisStep>();
        services.AddSingleton<ContextStep>();
        services.AddSingleton<ActivityStep>();
        services.AddSingleton<RagStep>();
        services.AddSingleton<EmotionStep>();
        services.AddSingleton<DecisionStep>();
        services.AddSingleton<LlmStep>();

        services.AddSingleton<IMessagePipeline>(sp =>
        {
            var pipeline = new Pipeline<MessageProcessingContext>()
                .AbortWhen(ctx => ctx.IsAborted)
                .AddStep(sp.GetRequiredService<MessageAnalysisStep>())
                .AddStep(sp.GetRequiredService<ContextStep>())
                .AddStep(sp.GetRequiredService<ActivityStep>())
                .AddStep(sp.GetRequiredService<RagStep>())
                .AddStep(sp.GetRequiredService<EmotionStep>())
                .AddStep(sp.GetRequiredService<DecisionStep>())
                .AddStep(sp.GetRequiredService<LlmStep>());

            return new MessagePipeline(pipeline);
        });
    }
}
