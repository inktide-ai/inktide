using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Graph.Infrastructure.Migrations
{
    // Brownfield baseline: table may already exist in production.
    // IF NOT EXISTS guards make this idempotent — succeeds on both fresh installs
    // and existing databases, registering the baseline in __EFMigrationsHistory.
    public partial class InitialGraphSchema : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema("graph");

            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS graph.graph_definitions (
                    id         uuid        NOT NULL,
                    project_id uuid,
                    user_id    uuid        NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
                    nodes      jsonb       NOT NULL DEFAULT '[]',
                    edges      jsonb       NOT NULL DEFAULT '[]',
                    updated_at timestamptz NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_graph_definitions" PRIMARY KEY (id)
                )
                """);

            migrationBuilder.Sql("""
                CREATE UNIQUE INDEX IF NOT EXISTS idx_graph_definitions_project_id
                ON graph.graph_definitions (project_id)
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable("graph_definitions", "graph");
        }
    }
}
