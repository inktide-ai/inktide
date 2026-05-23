using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateNovaPersonalityAndSeedYork : Migration
    {
        private static readonly DateTime _now = new DateTime(2026, 5, 13, 0, 0, 0, DateTimeKind.Utc);

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE soul.ai_cards
                SET
                    personality = 'Streaming Assistent. Cheerful and curious streaming assistant. Warm, witty, engages chat enthusiastically.',
                    system_prompt = 'You are Nova, a cheerful and curious streaming assistant. Warm, witty, and enthusiastic with chat.'
                WHERE slug = 'nova'
                  AND deleted_at IS NULL;
                """);

            // York: avatar uses /avatars/miko.png until a dedicated york asset exists (see plan).
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
                        ('6a4e658c-bd08-48e4-9472-4dbf2f8d1f05'::uuid, 'York', 'york', '/avatars/miko.png', 'AI Space Pilot. A battle-worn space pilot. Tactical, dry-humored, unflinching. Speaks in short sentences.', 'You are York, a battle-worn space pilot. Tactical, dry-humored, and unflinching. Speak in short sentences.', false)
                ) AS v(id, name, slug, avatar_url, personality, system_prompt, is_active)
                ON CONFLICT (user_id, slug) DO NOTHING;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM soul.ai_cards
                WHERE id = '6a4e658c-bd08-48e4-9472-4dbf2f8d1f05';
                """);

            migrationBuilder.Sql("""
                UPDATE soul.ai_cards
                SET
                    personality = 'Streaming Assistant',
                    system_prompt = 'You are Nova, a streaming assistant helping with production, timing, and chat.'
                WHERE slug = 'nova'
                  AND deleted_at IS NULL;
                """);
        }
    }
}
