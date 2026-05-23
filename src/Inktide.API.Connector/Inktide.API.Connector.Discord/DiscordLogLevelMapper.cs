using Discord;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Connector.Discord;

internal static class DiscordLogLevelMapper
{
    internal static LogLevel ToLogLevel(LogSeverity severity) => severity switch
    {
        LogSeverity.Critical => LogLevel.Critical,
        LogSeverity.Error    => LogLevel.Error,
        LogSeverity.Warning  => LogLevel.Warning,
        LogSeverity.Info     => LogLevel.Information,
        LogSeverity.Verbose  => LogLevel.Debug,
        LogSeverity.Debug    => LogLevel.Trace,
        _                    => LogLevel.Information,
    };
}
