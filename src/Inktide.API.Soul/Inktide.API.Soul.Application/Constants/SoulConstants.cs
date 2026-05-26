namespace Inktide.API.Soul.Application.Constants;

internal static class SoulConstants
{
    internal static class Upload
    {
        internal const long MaxAvatarBytes   = 52_428_800L;
        internal const long MaxBannerBytes   = 52_428_800L;
        internal const long MaxModelBytes    = 209_715_200L;
        internal const long MaxSceneBytes    = 52_428_800L;
        internal const int  MaxModelsPerCard = 20;
        internal const int  MaxScenesPerCard = 50;
        internal static readonly TimeSpan PresignTtl = TimeSpan.FromMinutes(15);
    }

    internal static class Slug
    {
        internal const int UniqueSuffixLength = 6;
    }

    internal static class ErrorCodes
    {
        internal const string CatalogNotFound    = "CATALOG_NOT_FOUND";
        internal const string CredentialMissing  = "CREDENTIAL_MISSING";
        internal const string LimitReached       = "LIMIT_REACHED";
        internal const string CredentialInvalid  = "CREDENTIAL_INVALID";
    }

}
