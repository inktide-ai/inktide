using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Memory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Idempotent: safe to run on existing databases created by the old EnsureCreated initializer.
            migrationBuilder.Sql("CREATE SCHEMA IF NOT EXISTS soul");

            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS soul.memory_metadata (
                    id               uuid                     NOT NULL,
                    ai_card_id       uuid                     NOT NULL,
                    qdrant_point_id  text                     NOT NULL,
                    fact_text        text                     NOT NULL,
                    category         text                     NOT NULL DEFAULT 'general',
                    source_type      text                     NOT NULL DEFAULT 'chat',
                    importance       double precision         NOT NULL DEFAULT 0.5,
                    remembered_at    timestamptz              NOT NULL,
                    last_recalled_at timestamptz,
                    recall_count     integer                  NOT NULL DEFAULT 0,
                    expires_at       timestamptz,
                    CONSTRAINT "PK_memory_metadata" PRIMARY KEY (id)
                )
                """);

            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS idx_memory_card ON soul.memory_metadata (ai_card_id)");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS idx_memory_category ON soul.memory_metadata (ai_card_id, category)");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS idx_memory_expiry ON soul.memory_metadata (expires_at) WHERE expires_at IS NOT NULL");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS idx_memory_importance ON soul.memory_metadata (ai_card_id, importance DESC)");
            migrationBuilder.Sql("""CREATE UNIQUE INDEX IF NOT EXISTS "IX_memory_metadata_ai_card_id_qdrant_point_id" ON soul.memory_metadata (ai_card_id, qdrant_point_id)""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "memory_metadata",
                schema: "soul");
        }
    }
}
