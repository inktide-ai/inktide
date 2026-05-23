using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Infrastructure.Configurations;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Soul.Infrastructure.DbContext;

public sealed class SoulDbContext : Microsoft.EntityFrameworkCore.DbContext, IDataProtectionKeyContext
{

    public SoulDbContext(DbContextOptions<SoulDbContext> options) : base(options) { }


    public DbSet<DataProtectionKey> DataProtectionKeys { get; set; } = null!;

    public DbSet<AiCard> AiCards => Set<AiCard>();
    public DbSet<AiCardChannel> AiCardChannels => Set<AiCardChannel>();
    public DbSet<AiCardTool> AiCardTools => Set<AiCardTool>();
    public DbSet<LlmCatalogEntry> LlmCatalog => Set<LlmCatalogEntry>();
    public DbSet<TtsCatalogEntry> TtsCatalog => Set<TtsCatalogEntry>();
    public DbSet<UsageDaily> UsageDaily => Set<UsageDaily>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<AiCardModel> AiCardModels => Set<AiCardModel>();
    public DbSet<AiCardScene> AiCardScenes => Set<AiCardScene>();
    public DbSet<AiCardCustomSceneTag> AiCardCustomSceneTags => Set<AiCardCustomSceneTag>();
    public DbSet<UserProviderCredential> UserProviderCredentials => Set<UserProviderCredential>();
    public DbSet<OutboxEvent> OutboxEvents => Set<OutboxEvent>();
    public DbSet<AiCardRunPreset> AiCardRunPresets => Set<AiCardRunPreset>();


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Global soft-delete filter: AiCard queries never return deleted rows unless
        // the caller explicitly calls IgnoreQueryFilters() (e.g., admin views).
        modelBuilder.Entity<AiCard>().HasQueryFilter(e => e.DeletedAt == null);

        modelBuilder.ApplyConfiguration(new AiCardConfiguration());
        modelBuilder.ApplyConfiguration(new AiCardChannelConfiguration());
        modelBuilder.ApplyConfiguration(new AiCardToolConfiguration());
        modelBuilder.ApplyConfiguration(new LlmCatalogConfiguration());
        modelBuilder.ApplyConfiguration(new TtsCatalogConfiguration());
        modelBuilder.ApplyConfiguration(new UsageDailyConfiguration());
        modelBuilder.ApplyConfiguration(new AuditLogConfiguration());
        modelBuilder.ApplyConfiguration(new AiCardModelConfiguration());
        modelBuilder.ApplyConfiguration(new AiCardSceneConfiguration());
        modelBuilder.ApplyConfiguration(new AiCardCustomSceneTagConfiguration());
        modelBuilder.ApplyConfiguration(new UserProviderCredentialConfiguration());
        modelBuilder.ApplyConfiguration(new OutboxEventConfiguration());
        modelBuilder.ApplyConfiguration(new AiCardRunPresetConfiguration());

        base.OnModelCreating(modelBuilder);
    }

}
