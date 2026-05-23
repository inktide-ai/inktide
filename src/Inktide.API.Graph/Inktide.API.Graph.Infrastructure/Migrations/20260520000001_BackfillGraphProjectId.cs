using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Graph.Infrastructure.Migrations
{
    // HISTORICAL DATA MIGRATION — one-time fix for the Chimera → Inktide rename.
    // The old schema stored soul IDs in character_id; the new schema uses project_id.
    //
    // The backfill SQL intentionally references project.projects — this is the ONLY
    // cross-schema reference in the Graph bounded context and it exists solely here.
    // After this migration runs it will never execute again. Graph has no ongoing
    // dependency on the Project schema after this point.
    public partial class BackfillGraphProjectId : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Rename character_id → project_id on pre-migration installs.
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_schema = 'graph'
                          AND table_name   = 'graph_definitions'
                          AND column_name  = 'character_id'
                    ) THEN
                        ALTER TABLE graph.graph_definitions RENAME COLUMN character_id TO project_id;
                    END IF;
                END $$
                """);

            // Ensure both columns exist regardless of install path.
            migrationBuilder.Sql("""
                ALTER TABLE graph.graph_definitions
                    ADD COLUMN IF NOT EXISTS project_id uuid;
                ALTER TABLE graph.graph_definitions
                    ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'
                """);

            // Rename legacy index if it still carries the old name.
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM pg_indexes
                        WHERE schemaname = 'graph'
                          AND indexname  = 'idx_graph_definitions_character_id'
                    ) THEN
                        ALTER INDEX graph.idx_graph_definitions_character_id
                            RENAME TO idx_graph_definitions_project_id;
                    END IF;
                END $$
                """);

            // Backfill project_id from project.projects where the value is still the old soul UUID.
            // Intentional cross-schema SQL — justified: one-time historical data fix only.
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = 'project'
                          AND table_name   = 'projects'
                    ) THEN
                        UPDATE graph.graph_definitions gd
                        SET project_id = p.id
                        FROM project.projects p
                        WHERE p.active_soul_id = gd.project_id
                          AND gd.project_id IS DISTINCT FROM p.id;
                    END IF;
                END $$
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Data-only fix — no structural rollback.
        }
    }
}
