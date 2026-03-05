using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using Chimera.Identity.API.Core;
using Chimera.Identity.API.REST.Controllers;
using Chimera.Identity.API.REST.Middleware;
using Chimera.Identity.API.REST.Models;
using Chimera.Identity.API.REST.Validation;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;

namespace Chimera.Identity.API.REST;

/// <summary>
/// Registers REST API services: MVC, FluentValidation, CORS, rate limiting, Swagger.
/// </summary>
public sealed class RestApiStartup : IStartup
{
    /// <inheritdoc />
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddSingleton<IExceptionResponseMapper, UserAlreadyExistsExceptionMapper>();
        services.AddSingleton<IExceptionResponseMapper, UniqueConstraintViolationExceptionMapper>();

        services
            .AddControllers()
            .AddApplicationPart(typeof(AuthController).Assembly)
            .AddNewtonsoftJson();

        services.AddFluentValidationAutoValidation();
        services.AddFluentValidationClientsideAdapters();
        services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

        services.Configure<ApiBehaviorOptions>(options =>
        {
            options.InvalidModelStateResponseFactory = actionContext =>
                new BadRequestObjectResult(ApiErrorResponse.From(
                    actionContext.ModelState
                        .SelectMany(x => x.Value?.Errors ?? [])
                        .FirstOrDefault()?.ErrorMessage ?? "Validation failed",
                    ErrorCodes.ValidationError));
        });

        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy => policy
                .WithOrigins(ctx.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                    ?? ["http://localhost:3000", "http://localhost:5173"])
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials());
        });

        services.AddRateLimiter(options =>
        {
            options.AddFixedWindowLimiter("auth", limiter =>
            {
                limiter.PermitLimit = ctx.Configuration.GetValue("RateLimiting:Auth:PermitLimit", 100);
                limiter.Window = TimeSpan.FromSeconds(ctx.Configuration.GetValue("RateLimiting:Auth:WindowSeconds", 60));
            });
        });

        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Chimera Identity API",
                Version = "v1"
            });
            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                In = ParameterLocation.Header,
                Description = "JWT: Bearer {token}",
                Name = "Authorization",
                Type = SecuritySchemeType.ApiKey
            });
            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });
    }
}
