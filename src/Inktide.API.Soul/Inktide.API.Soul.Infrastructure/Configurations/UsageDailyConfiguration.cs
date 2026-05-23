using Inktide.API.Soul.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Soul.Infrastructure.Configurations;

public sealed class UsageDailyConfiguration : IEntityTypeConfiguration<UsageDaily>
{

    public void Configure(EntityTypeBuilder<UsageDaily> b)
    {
        b.ToTable("usage_daily", "soul");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id)
            .HasColumnName("id");

        b.Property(e => e.AiCardId)
            .HasColumnName("ai_card_id")
            .IsRequired();

        b.Property(e => e.UsageDate)
            .HasColumnName("usage_date")
            .IsRequired();

        b.Property(e => e.LlmCalls)
            .HasColumnName("llm_calls")
            .HasDefaultValue(0);

        b.Property(e => e.TokensPrompt)
            .HasColumnName("tokens_prompt")
            .HasDefaultValue(0);

        b.Property(e => e.TokensCompletion)
            .HasColumnName("tokens_completion")
            .HasDefaultValue(0);

        b.Property(e => e.MessagesReceived)
            .HasColumnName("messages_received")
            .HasDefaultValue(0);

        b.Property(e => e.MessagesSent)
            .HasColumnName("messages_sent")
            .HasDefaultValue(0);

        b.Property(e => e.TtsCharacters)
            .HasColumnName("tts_characters")
            .HasDefaultValue(0);

        b.Property(e => e.DonkeyThoughts)
            .HasColumnName("donkey_thoughts")
            .HasDefaultValue(0);

        b.Property(e => e.VisionFramesProcessed)
            .HasColumnName("vision_frames_processed")
            .HasDefaultValue(0);

        b.Property(e => e.VisionEventsDetected)
            .HasColumnName("vision_events_detected")
            .HasDefaultValue(0);

        b.HasIndex(e => new { e.AiCardId, e.UsageDate })
            .IsUnique();

        b.HasIndex(e => e.UsageDate)
            .HasDatabaseName("idx_usage_daily_date");

        b.HasIndex(e => new { e.AiCardId, e.UsageDate })
            .HasDatabaseName("idx_usage_daily_card_date")
            .IsDescending(false, true);

        b.HasOne(e => e.AiCard)
            .WithMany()
            .HasForeignKey(e => e.AiCardId)
            .OnDelete(DeleteBehavior.Cascade);
    }

}
