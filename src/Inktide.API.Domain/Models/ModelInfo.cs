namespace Inktide.API.Domain.Models;

public sealed class ModelInfo
{

    private string _id = string.Empty;
    private string _name = string.Empty;


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

}
