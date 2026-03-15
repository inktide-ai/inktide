using Chimera.API.Core;
using Chimera.API.Synapse.Application.Interfaces;
using Chimera.API.Synapse.Application.Models;
using Chimera.API.Synapse.Application.Pipeline;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

using Chimera.API.Synapse.Infrastructure.Messaging;
using Chimera.API.Synapse.Infrastructure.Pipeline;
using Chimera.API.Synapse.Infrastructure.Pipeline.Steps;
using Chimera.API.Synapse.Infrastructure.Settings;

namespace Chimera.API.Synapse.Infrastructure;

/// <summary>
/// Registers infrastructure services (RabbitMQ consumer + publisher) into MS DI.
/// Discovered automatically by the module system via <see cref="IStartup"/>.
/// </summary>
public sealed class InfrastructureStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddOptions<RabbitMqSettings>()
            .BindConfiguration(nameof(RabbitMqSettings))
            .ValidateDataAnnotations()
            .ValidateOnStart();
        
        services.AddHostedService<ChatMessageConsumer>();
        
        services.AddSingleton<MessageAnalysisStep>();
        services.AddSingleton<ContextStep>();
        services.AddSingleton<ActivityStep>();
        services.AddSingleton<RagStep>();
        services.AddSingleton<EmotionStep>();
        services.AddSingleton<DecisionStep>();
        services.AddSingleton<LlmStep>();

        services.AddSingleton<IMessagePipeline>(sp =>
        {
            var pipeline = new PipelineType<MessageProcessingContext>()
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
