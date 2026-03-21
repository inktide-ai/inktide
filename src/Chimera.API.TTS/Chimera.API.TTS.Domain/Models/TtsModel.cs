namespace Chimera.API.TTS.Domain.Models;

public partial class TtsModel
{
    #region Fields

    private string _id = string.Empty;
    private string _model = string.Empty;
    private DateTimeOffset _created;
    private string _ownedBy = string.Empty;

    #endregion

    #region Properties

    public string Id => _id;
    public string Model => _model;
    public DateTimeOffset Created => _created;
    public string OwnedBy => _ownedBy;

    #endregion

    #region Constructors

    internal TtsModel(string id, string model, DateTimeOffset created, string ownedBy)
    {
        _id = id;
        _model = model;
        _created = created;
        _ownedBy = ownedBy;
    }

    #endregion
}