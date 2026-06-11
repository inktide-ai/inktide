using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Project.Infrastructure.Migrations
{
    public partial class AddProjectSkillsAndScenes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add behavior/settings columns to projects
            migrationBuilder.Sql("""
                ALTER TABLE project.projects
                  ADD COLUMN IF NOT EXISTS behavior_settings jsonb,
                  ADD COLUMN IF NOT EXISTS memory_settings   jsonb,
                  ADD COLUMN IF NOT EXISTS auto_pilot        jsonb,
                  ADD COLUMN IF NOT EXISTS features          jsonb
                """);

            // Project scenes table
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS project.project_scenes (
                    id              uuid         NOT NULL,
                    project_id      uuid         NOT NULL REFERENCES project.projects(id) ON DELETE CASCADE,
                    storage_key     text         NOT NULL,
                    public_url      text,
                    original_name   text,
                    content_type    text,
                    size_bytes      bigint,
                    display_name    text,
                    description     text,
                    sort_key        varchar(100),
                    created_at      timestamptz  NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_project_scenes" PRIMARY KEY (id)
                )
                """);

            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS idx_project_scenes_project_id
                ON project.project_scenes (project_id)
                """);

            // Project scene tags table
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS project.project_scene_tags (
                    id               uuid  NOT NULL,
                    project_id       uuid  NOT NULL REFERENCES project.projects(id) ON DELETE CASCADE,
                    label            text  NOT NULL,
                    label_normalized text  NOT NULL,
                    color            text,
                    CONSTRAINT "PK_project_scene_tags" PRIMARY KEY (id),
                    CONSTRAINT "UQ_project_scene_tags" UNIQUE (project_id, label_normalized)
                )
                """);

            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS idx_project_scene_tags_project_id
                ON project.project_scene_tags (project_id)
                """);

            // Project tools table (Skills)
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS project.project_tools (
                    id          uuid     NOT NULL,
                    project_id  uuid     NOT NULL REFERENCES project.projects(id) ON DELETE CASCADE,
                    tool_name   text     NOT NULL,
                    tool_config jsonb,
                    is_enabled  boolean  NOT NULL DEFAULT true,
                    created_at  timestamptz NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_project_tools" PRIMARY KEY (id)
                )
                """);

            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS idx_project_tools_project_id
                ON project.project_tools (project_id)
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS project.project_tools");
            migrationBuilder.Sql("DROP TABLE IF EXISTS project.project_scene_tags");
            migrationBuilder.Sql("DROP TABLE IF EXISTS project.project_scenes");
            migrationBuilder.Sql("""
                ALTER TABLE project.projects
                  DROP COLUMN IF EXISTS behavior_settings,
                  DROP COLUMN IF EXISTS memory_settings,
                  DROP COLUMN IF EXISTS auto_pilot,
                  DROP COLUMN IF EXISTS features
                """);
        }
    }
}
