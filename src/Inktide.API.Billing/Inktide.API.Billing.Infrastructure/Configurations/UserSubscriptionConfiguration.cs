using Inktide.API.Billing.Application.Models;
using Inktide.API.Core.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Inktide.API.Billing.Infrastructure.Configurations;

public sealed class UserSubscriptionConfiguration : IEntityTypeConfiguration<UserSubscription>
{
    public void Configure(EntityTypeBuilder<UserSubscription> b)
    {
        b.ToTable("user_subscriptions", "billing");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id).HasColumnName("id");

        b.Property(e => e.UserId)
            .HasColumnName("user_id")
            .HasMaxLength(64)
            .IsRequired();

        b.Property(e => e.Plan)
            .HasColumnName("plan")
            .HasConversion(new EnumToStringConverter<PlanType>())
            .HasMaxLength(16)
            .IsRequired();

        b.Property(e => e.Status)
            .HasColumnName("status")
            .HasConversion(new EnumToStringConverter<SubStatus>())
            .HasMaxLength(16)
            .IsRequired();

        b.Property(e => e.Provider)
            .HasColumnName("provider")
            .HasMaxLength(32)
            .IsRequired();

        b.Property(e => e.ProviderSubId)
            .HasColumnName("provider_sub_id")
            .HasMaxLength(128);

        b.Property(e => e.ProviderCustomerId)
            .HasColumnName("provider_customer_id")
            .HasMaxLength(128);

        b.Property(e => e.CurrentPeriodEnd).HasColumnName("current_period_end");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");

        b.HasIndex(e => e.UserId).HasDatabaseName("idx_billing_sub_user_id").IsUnique();
        b.HasIndex(e => e.ProviderSubId).HasDatabaseName("idx_billing_sub_provider_sub_id");
    }
}
