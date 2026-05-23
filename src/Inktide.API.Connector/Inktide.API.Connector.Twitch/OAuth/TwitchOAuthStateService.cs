using Inktide.API.Core.Generators;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;

namespace Inktide.API.Connector.Twitch.OAuth;

/// <summary>
/// Creates and verifies CSRF-protected state parameters for Twitch OAuth2.
/// State = Base64Url( JSON payload ) + "." + HMAC-SHA256 signature.
/// </summary>
public sealed class TwitchOAuthStateService
{
    private readonly byte[] _signingKey;

    public TwitchOAuthStateService(IConfiguration configuration)
    {
        var secret = configuration["AuthSettings:SigningSecret"]
            ?? configuration["CHANGE_ME__AUTH_SIGNING_SECRET_MIN_32_CHARS"]
            ?? throw new InvalidOperationException("Signing secret not configured.");
        _signingKey = Encoding.UTF8.GetBytes(secret);
    }

    public string CreateState(Guid userId, Guid cardId)
    {
        var payload = new OAuthStatePayload(
            UserId: userId.ToString(),
            CardId: cardId.ToString(),
            Nonce:  IdGenerator.New().ToString("N"),
            Exp:    DateTimeOffset.UtcNow.AddMinutes(10).ToUnixTimeSeconds());

        var json    = JsonSerializer.Serialize(payload);
        var encoded = Base64UrlEncode(Encoding.UTF8.GetBytes(json));
        var sig     = Sign(encoded);
        return $"{encoded}.{sig}";
    }

    public bool TryVerify(string state, out (Guid UserId, Guid CardId) ctx)
    {
        ctx = default;
        try
        {
            var parts = state.Split('.', 2);
            if (parts.Length != 2) return false;

            var (encoded, sig) = (parts[0], parts[1]);
            if (sig != Sign(encoded)) return false;

            var json    = Encoding.UTF8.GetString(Base64UrlDecode(encoded));
            var payload = JsonSerializer.Deserialize<OAuthStatePayload>(json);
            if (payload is null) return false;

            if (DateTimeOffset.UtcNow.ToUnixTimeSeconds() > payload.Exp) return false;

            ctx = (Guid.Parse(payload.UserId), Guid.Parse(payload.CardId));
            return true;
        }
        catch
        {
            return false;
        }
    }

    private string Sign(string data)
    {
        using var hmac = new HMACSHA256(_signingKey);
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return Base64UrlEncode(hash);
    }

    private static string Base64UrlEncode(byte[] data) =>
        Convert.ToBase64String(data).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] Base64UrlDecode(string s)
    {
        s = s.Replace('-', '+').Replace('_', '/');
        switch (s.Length % 4) { case 2: s += "=="; break; case 3: s += "="; break; }
        return Convert.FromBase64String(s);
    }

    private sealed record OAuthStatePayload(
        [property: JsonPropertyName("u")] string UserId,
        [property: JsonPropertyName("c")] string CardId,
        [property: JsonPropertyName("n")] string Nonce,
        [property: JsonPropertyName("e")] long   Exp);
}
