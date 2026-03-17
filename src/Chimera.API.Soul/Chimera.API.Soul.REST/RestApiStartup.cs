using Chimera.API.Core;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Chimera.API.Soul.REST;

public sealed class RestApiStartup : IStartup
{
    #region Public Methods

    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddFluentValidationAutoValidation();
        services.AddValidatorsFromAssemblyContaining<RestApiStartup>();
    }

    #endregion
}
