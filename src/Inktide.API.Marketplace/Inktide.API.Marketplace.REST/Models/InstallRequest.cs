using System.ComponentModel.DataAnnotations;

namespace Inktide.API.Marketplace.REST.Models;

public sealed record InstallRequest([Required] string ConnectorSlug);
