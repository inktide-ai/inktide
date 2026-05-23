using Inktide.API.Core;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Inktide.API.Soul.REST;

public sealed class RestApiStartup : IStartup
{

    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services
            .AddControllers()
            .AddNewtonsoftJson(options =>
            {
                options.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
                options.SerializerSettings.NullValueHandling = NullValueHandling.Ignore;
            })
            .ConfigureApiBehaviorOptions(opts =>
            {
                // Normalize FluentValidation failures to the same shape as manual controller errors.
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
        services.AddValidatorsFromAssemblyContaining<RestApiStartup>();
    }

}
