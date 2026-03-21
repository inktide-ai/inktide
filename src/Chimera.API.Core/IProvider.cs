using Chimera.API.Domain.Enums;
using Chimera.API.Domain.Models;
using FluentValidation.Results;

namespace Chimera.API.Core;


public interface IProvider
{
    #region Properties
    
    string Id { get; }
    string Name { get; }
    ProviderCategory Category { get; }
    
    #endregion
    
    #region Methods
    
    ValidationResult Validate(ProviderOptions options);
    
    #endregion
    
}
