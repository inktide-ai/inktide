using Newtonsoft.Json;

namespace Chimera.Identity.API.REST.Models;

public sealed record LoginResponse(
    [property: JsonProperty("accessToken")] string AccessToken,
    [property: JsonProperty("tokenType")] string TokenType,
    [property: JsonProperty("expiresIn")] int ExpiresIn,
    [property: JsonProperty("refreshToken")] string? RefreshToken,
    [property: JsonProperty("refreshExpiresIn")] int RefreshExpiresIn);
