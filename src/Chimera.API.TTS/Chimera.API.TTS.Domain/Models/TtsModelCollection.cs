using System.Collections.ObjectModel;

namespace Chimera.API.TTS.Domain.Models;

public partial class TtsModelCollection : ReadOnlyCollection<TtsModel>
{
    
    #region Fields
    
    private string _object = "list";
    
    #endregion
    
    #region Constructors 
    
    internal TtsModelCollection(
        string @object, 
        IList<TtsModel> items)
        : base(items ?? new List<TtsModel>())
    {
        _object = @object;
    }
    
    #endregion
    
    #region Properties
    
    public string Object => _object;
    
    #endregion
    
}