using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Infrastructure.Configurations;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Soul.Infrastructure.DbContext;

public sealed class SoulDbContext : Microsoft.EntityFrameworkCore.DbContext
{

    public SoulDbContext(DbContextOptions<SoulDbContext> options) : base(options) { }


    public DbSet<AiCard> AiCards => Set<AiCard>();
    public DbSet<AiCardChannel> AiCardChannels => Set<AiCardChannel>();
    public DbSet<AiCardTool> AiCardTools => Set<AiCardTool>();
    public DbSet<LlmCatalogEntry> LlmCatalog => Set<LlmCatalogEntry>();
    public DbSet<TtsCatalogEntry> TtsCatalog => Set<TtsCatalogEntry>();
    public DbSet<MemoryMetadata> MemoryMetadata => Set<MemoryMetadata>();
    public DbSet<UsageDaily> UsageDaily => Set<UsageDaily>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<AiCardModel> AiCardModels => Set<AiCardModel>();
    public DbSet<AiCardScene> AiCardScenes => Set<AiCardScene>();
    public DbSet<AiCardCustomSceneTag> AiCardCustomSceneTags => Set<AiCardCustomSceneTag>();
    public DbSet<UserProviderCredential> UserProviderCredentials => Set<UserProviderCredential>();


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new AiCardConfiguration());
        modelBuilder.ApplyConfiguration(new AiCardChannelConfiguration());
        modelBuilder.ApplyConfiguration(new AiCardToolConfiguration());
        modelBuilder.ApplyConfiguration(new LlmCatalogConfiguration());
        modelBuilder.ApplyConfiguration(new TtsCatalogConfiguration());
        modelBuilder.ApplyConfiguration(new MemoryMetadataConfiguration());
        modelBuilder.ApplyConfiguration(new UsageDailyConfiguration());
        modelBuilder.ApplyConfiguration(new AuditLogConfiguration());
        modelBuilder.ApplyConfiguration(new AiCardModelConfiguration());
        modelBuilder.ApplyConfiguration(new AiCardSceneConfiguration());
        modelBuilder.ApplyConfiguration(new AiCardCustomSceneTagConfiguration());
        modelBuilder.ApplyConfiguration(new UserProviderCredentialConfiguration());

        base.OnModelCreating(modelBuilder);
    }

}
