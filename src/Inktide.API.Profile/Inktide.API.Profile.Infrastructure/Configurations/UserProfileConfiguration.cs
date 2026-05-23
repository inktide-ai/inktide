using Inktide.API.Profile.Application.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Profile.Infrastructure.Configurations;

public sealed class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> b)
    {
        // Table stays in soul schema — no data movement required.
        b.ToTable("user_profiles", "soul");
        b.HasKey(e => e.UserId);
        b.Property(e => e.UserId).HasColumnName("user_id").HasMaxLength(64).IsRequired();
        b.Property(e => e.AvatarUrl).HasColumnName("avatar_url").HasMaxLength(2048);
    }
}
