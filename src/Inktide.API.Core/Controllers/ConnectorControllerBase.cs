using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Core.Controllers;

/// <summary>
/// Base controller shared by all connector REST controllers.
/// Provides claim extraction helpers so each controller doesn't duplicate them.
/// </summary>
public abstract class ConnectorControllerBase : ControllerBase
{
    /// <summary>
    /// Returns the authenticated user's ID from the JWT <c>sub</c> claim.
    /// </summary>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the claim is absent - indicates misconfigured auth middleware, not a
    /// user-facing auth failure. Expected 401s are handled by <c>[Authorize]</c> before
    /// this method is ever reached.
    /// </exception>
    protected Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException(
                "ClaimTypes.NameIdentifier absent on an authenticated principal. " +
                "Verify that the JWT middleware populates the sub claim correctly.");
        if (!Guid.TryParse(sub, out var id))
            throw new InvalidOperationException(
                $"ClaimTypes.NameIdentifier value '{sub}' is not a valid GUID. " +
                "Verify that the IdP issues UUID-format subject claims.");
        return id;
    }
}
