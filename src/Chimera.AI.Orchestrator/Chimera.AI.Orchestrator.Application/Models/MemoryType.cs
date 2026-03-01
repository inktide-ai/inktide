namespace Chimera.AI.Orchestrator.Application.Models;

/// <summary>
/// Distinguishes what kind of memory is stored in the vector DB.
/// </summary>
public enum MemoryType
{
    /// <summary>Raw chat message from a viewer.</summary>
    Message = 0,

    /// <summary>LLM-condensed summary of multiple interactions.</summary>
    Summary = 1
}
