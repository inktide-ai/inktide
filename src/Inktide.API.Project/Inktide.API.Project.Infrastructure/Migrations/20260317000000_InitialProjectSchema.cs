using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Project.Infrastructure.Migrations
{
    // Brownfield baseline: table may already exist in production.
    // IF NOT EXISTS guards make this idempotent — succeeds on both fresh installs
    // and existing databases, registering the baseline in __EFMigrationsHistory.
    public partial class InitialProjectSchema : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema("project");

            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS project.projects (
                    id              uuid         NOT NULL,
                    user_id         uuid         NOT NULL,
                    name            varchar(200) NOT NULL,
                    description     text,
                    active_soul_id  uuid,
                    active_model_id uuid,
                    active_scene_id uuid,
                    system_prompt   text,
                    status          varchar(50)  NOT NULL DEFAULT 'active',
                    sort_key        varchar(100) NOT NULL DEFAULT 'a0',
                    plugins_json    jsonb        NOT NULL DEFAULT '[]'::jsonb,
                    created_at      timestamptz  NOT NULL DEFAULT now(),
                    updated_at      timestamptz  NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_projects" PRIMARY KEY (id)
                )
                """);

            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS idx_projects_user_id
                ON project.projects (user_id)
                """);

            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS idx_projects_active_soul_id
                ON project.projects (active_soul_id)
                """);

            migrationBuilder.Sql("""
                CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_sort
                ON project.projects (user_id, sort_key)
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable("projects", "project");
        }
    }
}
