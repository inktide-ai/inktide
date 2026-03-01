using Newtonsoft.Json;

namespace Chimera.ApiGateway.REST.API.Models;

public sealed record MeResponse(
    [property: JsonProperty("userId")] string UserId,
    [property: JsonProperty("userName")] string UserName,
    [property: JsonProperty("role")] string Role);
