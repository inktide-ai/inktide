using Grpc.Core;

namespace Inktide.API.Soul.Grpc.AiCards.Service.Parsing;

internal static class GrpcGuidParser
{
    internal static bool TryParse(
        string? value,
        string fieldName,
        out Guid result,
        out RpcException? error)
    {
        if (Guid.TryParse(value, out result))
        {
            error = null;
            return true;
        }

        result = Guid.Empty;
        error  = new RpcException(new Status(StatusCode.InvalidArgument, $"Invalid {fieldName} format."));
        return false;
    }
}
