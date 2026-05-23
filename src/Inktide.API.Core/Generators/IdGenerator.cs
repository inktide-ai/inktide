namespace Inktide.API.Core.Generators;

public static class IdGenerator
{
    public static Guid New() => Guid.CreateVersion7();
}
