using System.Collections.ObjectModel;

namespace Chimera.API.TTS.Domain.Models;

public partial class SpeechModelCollection : ReadOnlyCollection<SpeechModel>
{
    
    #region Fields
    
    private string _object = "list";
    
    #endregion
    
    #region Constructors 
    
    internal SpeechModelCollection(
        string @object, 
        IList<SpeechModel> items)
        : base(items ?? new List<SpeechModel>())
    {
        _object = @object;
    }
    
    #endregion
    
    #region Properties
    
    public string Object => _object;
    
    #endregion
    
}