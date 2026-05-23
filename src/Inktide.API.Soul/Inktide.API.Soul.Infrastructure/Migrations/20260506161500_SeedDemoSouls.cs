using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedDemoSouls : Migration
    {
        private static readonly DateTime _now = new DateTime(2026, 5, 6, 0, 0, 0, DateTimeKind.Utc);

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Seed extra demo souls for users that already have at least one soul.
            // We reuse one existing card's model/config fields per user so inserted cards are valid and API-ready.
            migrationBuilder.Sql($"""
                WITH base_source AS (
                    SELECT
                        DISTINCT ON (user_id)
                        user_id,
                        llm_catalog_id,
                        llm_config,
                        tts_catalog_id,
                        tts_config,
                        appearance,
                        response_behavior,
                        memory_settings,
                        auto_pilot,
                        visibility
                    FROM soul.ai_cards
                    WHERE deleted_at IS NULL
                    ORDER BY user_id, updated_at DESC
                )
                INSERT INTO soul.ai_cards (
                    id, user_id, name, slug, avatar_url, personality, system_prompt,
                    llm_catalog_id, llm_config, tts_catalog_id, tts_config,
                    appearance, response_behavior, memory_settings, auto_pilot,
                    visibility, is_active, created_at, updated_at
                )
                SELECT
                    v.id,
                    h.user_id,
                    v.name,
                    v.slug,
                    v.avatar_url,
                    v.personality,
                    v.system_prompt,
                    h.llm_catalog_id,
                    h.llm_config,
                    h.tts_catalog_id,
                    h.tts_config,
                    h.appearance,
                    h.response_behavior,
                    h.memory_settings,
                    h.auto_pilot,
                    h.visibility,
                    v.is_active,
                    '{_now:O}',
                    '{_now:O}'
                FROM base_source h
                CROSS JOIN (
                    VALUES
                        ('6a4e658c-bd08-48e4-9472-4dbf2f8d1f01'::uuid, 'Evelyn', 'evelyn', '/avatars/evelyn.png', 'Discord Manager', 'You are Evelyn, a Discord manager helping moderate and organize communities.', false),
                        ('6a4e658c-bd08-48e4-9472-4dbf2f8d1f02'::uuid, 'Luna',   'luna',   '/avatars/luna2.png',  'AI VTuber',       'You are Luna, an expressive AI VTuber focused on live audience engagement.', true),
                        ('6a4e658c-bd08-48e4-9472-4dbf2f8d1f03'::uuid, 'Miko',   'miko',   '/avatars/miko.png',   'Chat Bot',        'You are Miko, a concise and friendly chat bot for fast conversational support.', true),
                        ('6a4e658c-bd08-48e4-9472-4dbf2f8d1f04'::uuid, 'Nova',   'nova',   '/avatars/nova.png',   'Streaming Assistant', 'You are Nova, a streaming assistant helping with production, timing, and chat.', false)
                ) AS v(id, name, slug, avatar_url, personality, system_prompt, is_active)
                ON CONFLICT (user_id, slug) DO NOTHING;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM soul.ai_cards
                WHERE id IN (
                    '6a4e658c-bd08-48e4-9472-4dbf2f8d1f01',
                    '6a4e658c-bd08-48e4-9472-4dbf2f8d1f02',
                    '6a4e658c-bd08-48e4-9472-4dbf2f8d1f03',
                    '6a4e658c-bd08-48e4-9472-4dbf2f8d1f04'
                );
                """);
        }
    }
}
