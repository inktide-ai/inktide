using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.REST.Models;
using Newtonsoft.Json;

namespace Inktide.API.Soul.REST.Mappers;

/// <summary>
/// Maps AiCardTool domain entities to REST response models.
/// SRP: one reason to change — tool read representation.
/// OCP: adding a new tool field only requires editing this file.
/// </summary>
public static class ToolResponseMapper
{
    public static ToolResponse ToToolResponse(AiCardTool tool)
    {
        ArgumentNullException.ThrowIfNull(tool);
        return new ToolResponse
        {
            Id         = tool.Id,
            ToolName   = tool.ToolName,
            ToolConfig = DeserializeJson(tool.ToolConfig),
            IsEnabled  = tool.IsEnabled,
        };
    }

    private static object? DeserializeJson(string? json) =>
        string.IsNullOrEmpty(json) ? null : JsonConvert.DeserializeObject(json);
}
