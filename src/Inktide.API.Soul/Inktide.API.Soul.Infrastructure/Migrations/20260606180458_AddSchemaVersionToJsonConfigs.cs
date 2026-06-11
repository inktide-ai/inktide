using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSchemaVersionToJsonConfigs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Backfill schema_version: 1 into existing jsonb rows that predate versioning.
            // jsonb || operator merges without overwriting existing keys, so re-running is safe.
            migrationBuilder.Sql("""
                UPDATE soul.ai_cards
                SET llm_config = llm_config || '{"schema_version":1}'::jsonb
                WHERE llm_config -> 'schema_version' IS NULL;

                UPDATE soul.ai_cards
                SET tts_config = tts_config || '{"schema_version":1}'::jsonb
                WHERE tts_config IS NOT NULL
                  AND tts_config -> 'schema_version' IS NULL;

                UPDATE soul.ai_cards
                SET appearance = appearance || '{"schema_version":1}'::jsonb
                WHERE appearance -> 'schema_version' IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE soul.ai_cards SET llm_config = llm_config - 'schema_version';
                UPDATE soul.ai_cards SET tts_config = tts_config - 'schema_version' WHERE tts_config IS NOT NULL;
                UPDATE soul.ai_cards SET appearance = appearance - 'schema_version';
                """);
        }
    }
}
