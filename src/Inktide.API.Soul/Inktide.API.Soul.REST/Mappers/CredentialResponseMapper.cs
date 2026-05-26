using Inktide.API.Soul.Application.Models;
using Inktide.API.Soul.REST.Models;

namespace Inktide.API.Soul.REST.Mappers;

public static class CredentialResponseMapper
{
    public static CredentialResponse ToResponse(UserProviderCredentialSummary s) =>
        new(s.ProviderId, s.HasKey, s.BaseUrl, s.Config, s.UpdatedAt, s.VerifiedAt, s.LastError);
}
