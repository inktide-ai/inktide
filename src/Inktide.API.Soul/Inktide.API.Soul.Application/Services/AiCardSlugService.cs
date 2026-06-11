using Inktide.API.Soul.Application.Constants;
using Inktide.API.Soul.Application.Interfaces;

namespace Inktide.API.Soul.Application.Services;

public sealed class AiCardSlugService : IAiCardSlugService
{
    private readonly ISlugGenerator _slugGenerator;

    public AiCardSlugService(ISlugGenerator slugGenerator)
    {
        _slugGenerator = slugGenerator ?? throw new ArgumentNullException(nameof(slugGenerator));
    }

    public async Task<string> GenerateUniqueAsync(
        string name,
        Func<string, Task<bool>> existsAsync,
        CancellationToken ct = default)
    {
        var slug = _slugGenerator.Generate(name);

        while (await existsAsync(slug).ConfigureAwait(false))
        {
            slug = _slugGenerator.Generate(name) + "-" +
                   Guid.NewGuid().ToString("N")[..SoulConstants.Slug.UniqueSuffixLength];
        }

        return slug;
    }
}
