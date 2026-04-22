using Amazon.S3;
using Chimera.API.Core;
using Chimera.API.Profile.Application.Interfaces;
using Chimera.API.Profile.Infrastructure.Keycloak;
using Chimera.API.Profile.Infrastructure.Services;
using Chimera.API.Profile.Infrastructure.Settings;
using Chimera.API.Profile.Infrastructure.Storage;
using DryIoc;
using Microsoft.Extensions.Configuration;

namespace Chimera.API.Profile.Infrastructure.DependencyInjection;

public sealed class InfrastructureServiceRegistrator : IServiceRegistrator
{

    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        var keycloakAdmin = new KeycloakAdminSettings();
        configuration.GetSection(nameof(KeycloakAdminSettings)).Bind(keycloakAdmin);
        registrator.RegisterInstance(keycloakAdmin);

        registrator.Register<IKeycloakAdminClient, KeycloakAdminClient>(Reuse.Singleton);
        registrator.Register<IUserAccountDeletionService, UserAccountDeletionService>(Reuse.Scoped);
        registrator.Register<IUserAvatarService, UserAvatarService>(Reuse.Scoped);

        var s3Settings = new S3Settings();
        configuration.GetSection(nameof(S3Settings)).Bind(s3Settings);
        registrator.RegisterInstance(s3Settings);

        if (IsObjectStorageReady(s3Settings))
        {
            registrator.RegisterDelegate<IAmazonS3>(
                r => CreateAmazonS3Client(r.Resolve<S3Settings>()),
                Reuse.Singleton);
            registrator.Register<IObjectStorageService, S3ObjectStorageService>(Reuse.Singleton);
        }
        else
        {
            registrator.Register<IObjectStorageService, DisabledObjectStorageService>(Reuse.Singleton);
        }
    }


    private static bool IsObjectStorageReady(S3Settings s)
    {
        if (!s.Enabled)
            return false;

        if (string.IsNullOrWhiteSpace(s.ServiceUrl)
            || string.IsNullOrWhiteSpace(s.AccessKey)
            || string.IsNullOrWhiteSpace(s.SecretKey)
            || string.IsNullOrWhiteSpace(s.DefaultBucket))
            return false;

        return true;
    }

    private static IAmazonS3 CreateAmazonS3Client(S3Settings settings)
    {
        var serviceUri = new Uri(settings.ServiceUrl.TrimEnd('/'));
        var config = new AmazonS3Config
        {
            ServiceURL = settings.ServiceUrl.TrimEnd('/'),
            ForcePathStyle = settings.ForcePathStyle,
            AuthenticationRegion = settings.Region,
            UseHttp = serviceUri.Scheme == Uri.UriSchemeHttp,
        };

        return new AmazonS3Client(settings.AccessKey, settings.SecretKey, config);
    }

}
