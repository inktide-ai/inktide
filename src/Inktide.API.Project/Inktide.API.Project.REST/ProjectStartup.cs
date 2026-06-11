using FluentValidation;
using FluentValidation.AspNetCore;
using Inktide.API.Core;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Inktide.API.Project.REST;

public sealed class ProjectStartup : IStartup, IEndpointConfigurator
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddControllers()
            .AddApplicationPart(typeof(ProjectStartup).Assembly)
            .AddJsonOptions(options =>
                options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase)
            .ConfigureApiBehaviorOptions(opts =>
            {
                opts.InvalidModelStateResponseFactory = ctx =>
                {
                    var fields = ctx.ModelState
                        .Where(e => e.Value?.Errors.Count > 0)
                        .Select(e => new { field = e.Key, message = e.Value!.Errors[0].ErrorMessage })
                        .ToList();
                    return new BadRequestObjectResult(new
                    {
                        error  = "Validation failed.",
                        code   = "VALIDATION_ERROR",
                        fields,
                    });
                };
            });

        services.AddFluentValidationAutoValidation();
        services.AddValidatorsFromAssemblyContaining<ProjectStartup>();
    }

    public void Map(IEndpointRouteBuilder app)
    {
        app.MapControllers();
    }
}
