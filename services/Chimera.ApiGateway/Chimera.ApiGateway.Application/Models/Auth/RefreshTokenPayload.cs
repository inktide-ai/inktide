namespace Chimera.ApiGateway.Application.Models.Auth;

/// <summary>
/// User identity stored in Redis alongside a refresh token.
/// <see cref="FamilyId"/> ties every rotated token back to the original login session;
/// it is used to detect refresh-token reuse attacks and revoke the entire session.
/// </summary>
public sealed record RefreshTokenPayload(string UserId, string Role, string FamilyId);
