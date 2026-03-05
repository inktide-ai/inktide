using Newtonsoft.Json;

namespace Chimera.Identity.API.REST.Models;

public sealed record MeResponse(
    [property: JsonProperty("userId")] string UserId,
    [property: JsonProperty("userName")] string UserName,
    [property: JsonProperty("role")] string Role);
