namespace Chimera.API.Domain.Models;

public sealed class ModelInfo
{
    #region Fields

    private string _id = string.Empty;
    private string _name = string.Empty;

    #endregion

    #region Properties

    public string Id
    {
        get => _id;
        set => _id = value;
    }

    public string Name
    {
        get => _name;
        set => _name = value;
    }

    #endregion
}
