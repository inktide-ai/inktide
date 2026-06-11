namespace Inktide.API.Organization.Application.Exceptions;

public sealed class OrganizationConcurrentCreationException()
    : Exception("Concurrent organization creation detected — another request won the race.");
