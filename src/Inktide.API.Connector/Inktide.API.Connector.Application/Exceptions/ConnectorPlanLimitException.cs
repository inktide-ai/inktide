namespace Inktide.API.Connector.Application.Exceptions;

public sealed class ConnectorPlanLimitException : Exception
{
    public ConnectorPlanLimitException(string message) : base(message) { }
}
