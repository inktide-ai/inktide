using System.Collections.ObjectModel;

namespace Chimera.API.TTS.Domain.Models;

public partial class TtsVoiceCollection : ReadOnlyCollection<string>
{
    #region Constructors

    internal TtsVoiceCollection(IList<string> items)
        : base(items ?? new List<string>())
    {
    }

    #endregion
}
