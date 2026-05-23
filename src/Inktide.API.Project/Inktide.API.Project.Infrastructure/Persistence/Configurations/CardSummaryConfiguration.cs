using Inktide.API.Project.Infrastructure.Persistence.ReadModels;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Project.Infrastructure.Persistence.Configurations;

internal sealed class CardSummaryConfiguration : IEntityTypeConfiguration<CardSummaryReadModel>
{
    public void Configure(EntityTypeBuilder<CardSummaryReadModel> b)
    {
        b.ToTable("ai_cards", "soul");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.Name).HasColumnName("name");
        b.Property(e => e.AvatarUrl).HasColumnName("avatar_url");
    }
}
