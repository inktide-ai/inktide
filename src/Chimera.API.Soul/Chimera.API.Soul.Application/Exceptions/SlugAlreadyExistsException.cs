namespace Chimera.API.Soul.Application.Exceptions;

public sealed class SlugAlreadyExistsException : Exception
{

    private readonly string _slug;


    public string Slug { get => _slug; }


    public SlugAlreadyExistsException(string slug)
        : base($"AI card with slug '{slug}' already exists for this user.")
    {
        _slug = slug;
    }

}
