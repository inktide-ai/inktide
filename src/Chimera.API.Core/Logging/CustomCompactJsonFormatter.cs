using Serilog.Events;
using Serilog.Formatting;
using Serilog.Formatting.Json;
using Serilog.Parsing;

namespace Chimera.API.Core.Logging;


public sealed class CustomCompactJsonFormatter : ITextFormatter
{
    private readonly JsonValueFormatter _valueFormatter;
    private readonly bool _useUtcTimezone;

    public CustomCompactJsonFormatter(
        JsonValueFormatter? valueFormatter = null,
        bool useUtcTimezone = false)
    {
        _valueFormatter = valueFormatter ?? new JsonValueFormatter("$type");
        _useUtcTimezone = useUtcTimezone;
    }


    private static void FormatEvent(
        LogEvent logEvent,
        TextWriter output,
        JsonValueFormatter valueFormatter,
        bool useUtcTimezone = true)
    {
        ArgumentNullException.ThrowIfNull(logEvent);
        ArgumentNullException.ThrowIfNull(output);
        ArgumentNullException.ThrowIfNull(valueFormatter);

        output.Write("{\"@t\":\"");

        output.Write(useUtcTimezone
            ? logEvent.Timestamp.UtcDateTime.ToString("O")
            : logEvent.Timestamp.LocalDateTime.ToString("O"));

        output.Write("\",\"@mt\":");
        JsonValueFormatter.WriteQuotedJsonString(logEvent.MessageTemplate.Text, output);

        var tokensWithFormat = logEvent.MessageTemplate.Tokens
            .OfType<PropertyToken>()
            .Where(pt => pt.Format != null);

        if (tokensWithFormat.Any())
        {
            output.Write(",\"@r\":[");
            var delimiter = "";

            foreach (var r in tokensWithFormat)
            {
                output.Write(delimiter);
                delimiter = ",";
                var space = new StringWriter();
                r.Render(logEvent.Properties, space);
                JsonValueFormatter.WriteQuotedJsonString(space.ToString(), output);
            }
            output.Write(']');
        }

        if (logEvent.Level != LogEventLevel.Information)
        {
            output.Write(",\"@l\":\"");
            output.Write(logEvent.Level);
            output.Write('\"');
        }

        if (logEvent.Exception != null)
        {
            output.Write(",\"@x\":");
            JsonValueFormatter.WriteQuotedJsonString(logEvent.Exception.ToString(), output);
        }

        foreach (var property in logEvent.Properties)
        {
            var name = property.Key;
            if (name.Length > 0 && name[0] == '@')
            {
                // Escape first '@' by doubling
                name = '@' + name;
            }

            output.Write(',');
            JsonValueFormatter.WriteQuotedJsonString(name, output);
            output.Write(':');
            valueFormatter.Format(property.Value, output);
        }

        output.Write('}');
    }


    public void Format(
        LogEvent logEvent,
        TextWriter output)
    {
        FormatEvent(logEvent, output, _valueFormatter, _useUtcTimezone);
        output.WriteLine();
    }


}
