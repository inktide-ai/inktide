using Inktide.API.Soul.Application.Models;
using Inktide.API.Soul.Domain.Entities;

namespace Inktide.API.Soul.Application.Queries;

public sealed record SoulCreationValidationData(
    LlmCatalogEntry?        LlmEntry,
    TtsCatalogEntry?        TtsEntry,
    DecryptedCredential?    LlmDecryptedCred,
    UserProviderCredential? LlmCredEntity,
    DecryptedCredential?    TtsDecryptedCred,
    UserProviderCredential? TtsCredEntity);
