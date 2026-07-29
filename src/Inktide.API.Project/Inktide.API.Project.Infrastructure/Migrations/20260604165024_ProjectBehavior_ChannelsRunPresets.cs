using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Project.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ProjectBehavior_ChannelsRunPresets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // auto_pilot, behavior_settings, memory_settings already exist in DB - skip
            // project_scenes, project_tools already exist in DB - skip

            migrationBuilder.AddColumn<string>(
                name: "personality",
                schema: "project",
                table: "projects",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "personality_config",
                schema: "project",
                table: "projects",
                type: "jsonb",
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.AddColumn<string>(
                name: "response_behavior",
                schema: "project",
                table: "projects",
                type: "jsonb",
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.AddColumn<string>(
                name: "screen_awareness_settings",
                schema: "project",
                table: "projects",
                type: "jsonb",
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.CreateTable(
                name: "project_channels",
                schema: "project",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    platform = table.Column<string>(type: "text", nullable: false, defaultValue: "twitch"),
                    channel_name = table.Column<string>(type: "text", nullable: false),
                    channel_id = table.Column<string>(type: "text", nullable: true),
                    bot_username = table.Column<string>(type: "text", nullable: false, defaultValue: ""),
                    oauth_token_enc = table.Column<string>(type: "text", nullable: true),
                    refresh_token_enc = table.Column<string>(type: "text", nullable: true),
                    custom_bot_token_enc = table.Column<string>(type: "text", nullable: true),
                    token_expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    connected_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_channels", x => x.id);
                    table.ForeignKey(
                        name: "FK_project_channels_projects_project_id",
                        column: x => x.project_id,
                        principalSchema: "project",
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "project_run_presets",
                schema: "project",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    icon = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    override_llm_model_id = table.Column<string>(type: "text", nullable: true),
                    override_temperature = table.Column<float>(type: "real", nullable: true),
                    override_emotion_preset_id = table.Column<string>(type: "text", nullable: true),
                    override_voice_profile_id = table.Column<string>(type: "text", nullable: true),
                    sort_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "a0"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_run_presets", x => x.id);
                    table.ForeignKey(
                        name: "FK_project_run_presets_projects_project_id",
                        column: x => x.project_id,
                        principalSchema: "project",
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_project_channels_project_id",
                schema: "project",
                table: "project_channels",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "IX_project_channels_project_id_platform_channel_name",
                schema: "project",
                table: "project_channels",
                columns: new[] { "project_id", "platform", "channel_name" },
                unique: true,
                filter: "project_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "idx_project_run_presets_project_id",
                schema: "project",
                table: "project_run_presets",
                column: "project_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "project_channels",
                schema: "project");

            migrationBuilder.DropTable(
                name: "project_run_presets",
                schema: "project");

            migrationBuilder.DropColumn(
                name: "personality",
                schema: "project",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "personality_config",
                schema: "project",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "response_behavior",
                schema: "project",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "screen_awareness_settings",
                schema: "project",
                table: "projects");
        }
    }
}
