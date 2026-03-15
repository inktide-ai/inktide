using Newtonsoft.Json;

namespace Chimera.API.Identify.REST.Models;

public sealed record MeResponse(
    [property: JsonProperty("userId")] string UserId,
    [property: JsonProperty("userName")] string UserName,
    [property: JsonProperty("role")] string Role);
