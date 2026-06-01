namespace Inktide.API.Mcp.REST.Tools;

public record OperationResult(bool Success, string? Error)
{
    public static OperationResult Ok()               => new(true,  null);
    public static OperationResult Fail(string error) => new(false, error);
}
