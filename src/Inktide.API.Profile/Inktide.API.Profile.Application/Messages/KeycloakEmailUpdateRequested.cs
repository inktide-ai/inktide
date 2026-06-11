namespace Inktide.API.Profile.Application.Messages;

public record KeycloakEmailUpdateRequested(Guid UserId, string NewEmail);
