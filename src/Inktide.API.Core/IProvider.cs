using Inktide.API.Domain.Enums;
using Inktide.API.Domain.Models;
using FluentValidation.Results;

namespace Inktide.API.Core;


public interface IProvider
{
    
    string Id { get; }
    string Name { get; }
    ProviderCategory Category { get; }
    
    
    ValidationResult Validate(ProviderOptions options);
    
    
}
