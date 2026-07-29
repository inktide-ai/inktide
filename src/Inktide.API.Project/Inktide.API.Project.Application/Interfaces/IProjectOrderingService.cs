using Inktide.API.Project.Domain.Entities;

namespace Inktide.API.Project.Application.Interfaces;

public interface IProjectOrderingService
{
    /// <summary>Move a project to a new position. previousId=null -> beginning; nextId=null -> end. Returns null when not found.</summary>
    Task<ProjectEntity?> ReorderAsync(Guid id, Guid userId, Guid? previousId, Guid? nextId, CancellationToken ct = default);
}
