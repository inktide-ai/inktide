using Chimera.API.Domain.Enums;
using Chimera.API.Domain.Models;
using FluentValidation.Results;

namespace Chimera.API.Core;


public interface IProvider
{
    
    string Id { get; }
    string Name { get; }
    ProviderCategory Category { get; }
    
    
    ValidationResult Validate(ProviderOptions options);
    
    
}
