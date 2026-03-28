using System.Collections.ObjectModel;

namespace Chimera.API.TTS.Domain.Models;

public partial class SpeechVoiceCollection : ReadOnlyCollection<string>
{
    #region Constructors

    internal SpeechVoiceCollection(IList<string> items)
        : base(items ?? new List<string>())
    {
    }

    #endregion
}
