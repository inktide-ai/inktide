namespace Inktide.API.Profile.Infrastructure.Constants;

internal static class ProfileConstants
{
    internal static class Cache
    {
        internal const string AvatarKeyPrefix = "user:avatar:";
        internal static readonly TimeSpan AvatarTtl = TimeSpan.FromMinutes(5);
    }

    internal static class EmailChange
    {
        internal const int    CodeLength    = 6;
        internal const int    TtlMinutes    = 10;
        internal const string RedisKeyPrefix = "email_change:";
        internal const string CodeAlphabet  = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    }
}
