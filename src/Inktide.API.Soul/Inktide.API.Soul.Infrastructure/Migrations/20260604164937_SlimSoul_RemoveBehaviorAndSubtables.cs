using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SlimSoul_RemoveBehaviorAndSubtables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ai_card_channels",
                schema: "soul");

            migrationBuilder.DropTable(
                name: "ai_card_custom_scene_tags",
                schema: "soul");

            migrationBuilder.DropTable(
                name: "ai_card_run_presets",
                schema: "soul");

            migrationBuilder.DropTable(
                name: "ai_card_scenes",
                schema: "soul");

            migrationBuilder.DropTable(
                name: "ai_card_tools",
                schema: "soul");

            migrationBuilder.DropColumn(
                name: "auto_pilot",
                schema: "soul",
                table: "ai_cards");

            migrationBuilder.DropColumn(
                name: "memory_settings",
                schema: "soul",
                table: "ai_cards");

            migrationBuilder.DropColumn(
                name: "personality",
                schema: "soul",
                table: "ai_cards");

            migrationBuilder.DropColumn(
                name: "personality_config",
                schema: "soul",
                table: "ai_cards");

            migrationBuilder.DropColumn(
                name: "response_behavior",
                schema: "soul",
                table: "ai_cards");

            migrationBuilder.DropColumn(
                name: "screen_awareness_settings",
                schema: "soul",
                table: "ai_cards");

            migrationBuilder.DropColumn(
                name: "system_prompt",
                schema: "soul",
                table: "ai_cards");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "auto_pilot",
                schema: "soul",
                table: "ai_cards",
                type: "jsonb",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "memory_settings",
                schema: "soul",
                table: "ai_cards",
                type: "jsonb",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "personality",
                schema: "soul",
                table: "ai_cards",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "personality_config",
                schema: "soul",
                table: "ai_cards",
                type: "jsonb",
                nullable: false,
                defaultValueSql: "'{}'");

            migrationBuilder.AddColumn<string>(
                name: "response_behavior",
                schema: "soul",
                table: "ai_cards",
                type: "jsonb",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "screen_awareness_settings",
                schema: "soul",
                table: "ai_cards",
                type: "jsonb",
                nullable: false,
                defaultValueSql: "'{}'");

            migrationBuilder.AddColumn<string>(
                name: "system_prompt",
                schema: "soul",
                table: "ai_cards",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "ai_card_channels",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    ai_card_id = table.Column<Guid>(type: "uuid", nullable: false),
                    bot_username = table.Column<string>(type: "text", nullable: false),
                    channel_id = table.Column<string>(type: "text", nullable: true),
                    channel_name = table.Column<string>(type: "text", nullable: false),
                    connected_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    custom_bot_token_enc = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    oauth_token_enc = table.Column<string>(type: "text", nullable: true),
                    platform = table.Column<string>(type: "text", nullable: false, defaultValue: "twitch"),
                    project_id = table.Column<Guid>(type: "uuid", nullable: true),
                    refresh_token_enc = table.Column<string>(type: "text", nullable: true),
                    token_expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_card_channels", x => x.id);
                    table.ForeignKey(
                        name: "FK_ai_card_channels_ai_cards_ai_card_id",
                        column: x => x.ai_card_id,
                        principalSchema: "soul",
                        principalTable: "ai_cards",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ai_card_custom_scene_tags",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    ai_card_id = table.Column<Guid>(type: "uuid", nullable: false),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    label = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    label_normalized = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_card_custom_scene_tags", x => x.id);
                    table.ForeignKey(
                        name: "FK_ai_card_custom_scene_tags_ai_cards_ai_card_id",
                        column: x => x.ai_card_id,
                        principalSchema: "soul",
                        principalTable: "ai_cards",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ai_card_run_presets",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    ai_card_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    icon = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    override_emotion_preset_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    override_llm_model_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    override_temperature = table.Column<float>(type: "real", nullable: true),
                    override_voice_profile_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    sort_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "a0"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_card_run_presets", x => x.id);
                    table.ForeignKey(
                        name: "FK_ai_card_run_presets_ai_cards_ai_card_id",
                        column: x => x.ai_card_id,
                        principalSchema: "soul",
                        principalTable: "ai_cards",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ai_card_scenes",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    ai_card_id = table.Column<Guid>(type: "uuid", nullable: false),
                    content_type = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    display_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    original_file_name = table.Column<string>(type: "text", nullable: false),
                    public_url = table.Column<string>(type: "text", nullable: false),
                    size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    sort_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "a0"),
                    storage_key = table.Column<string>(type: "text", nullable: false),
                    tag = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_card_scenes", x => x.id);
                    table.ForeignKey(
                        name: "FK_ai_card_scenes_ai_cards_ai_card_id",
                        column: x => x.ai_card_id,
                        principalSchema: "soul",
                        principalTable: "ai_cards",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ai_card_tools",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    ai_card_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    tool_config = table.Column<string>(type: "jsonb", nullable: false),
                    tool_name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_card_tools", x => x.id);
                    table.ForeignKey(
                        name: "FK_ai_card_tools_ai_cards_ai_card_id",
                        column: x => x.ai_card_id,
                        principalSchema: "soul",
                        principalTable: "ai_cards",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_channels_active",
                schema: "soul",
                table: "ai_card_channels",
                columns: new[] { "platform", "is_active" },
                filter: "is_active = true");

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_channels_card",
                schema: "soul",
                table: "ai_card_channels",
                column: "ai_card_id");

            migrationBuilder.CreateIndex(
                name: "IX_ai_card_channels_ai_card_id_platform_channel_name",
                schema: "soul",
                table: "ai_card_channels",
                columns: new[] { "ai_card_id", "platform", "channel_name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ai_card_channels_project_id_platform_channel_name",
                schema: "soul",
                table: "ai_card_channels",
                columns: new[] { "project_id", "platform", "channel_name" },
                filter: "project_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_custom_scene_tags_card",
                schema: "soul",
                table: "ai_card_custom_scene_tags",
                column: "ai_card_id");

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_custom_scene_tags_card_label_norm",
                schema: "soul",
                table: "ai_card_custom_scene_tags",
                columns: new[] { "ai_card_id", "label_normalized" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_run_presets_active",
                schema: "soul",
                table: "ai_card_run_presets",
                columns: new[] { "ai_card_id", "is_active" },
                unique: true,
                filter: "is_active = true");

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_run_presets_card",
                schema: "soul",
                table: "ai_card_run_presets",
                column: "ai_card_id");

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_run_presets_sort",
                schema: "soul",
                table: "ai_card_run_presets",
                columns: new[] { "ai_card_id", "sort_key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_run_presets_user_card",
                schema: "soul",
                table: "ai_card_run_presets",
                columns: new[] { "user_id", "ai_card_id" });

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_scenes_card",
                schema: "soul",
                table: "ai_card_scenes",
                column: "ai_card_id");

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_scenes_sort",
                schema: "soul",
                table: "ai_card_scenes",
                columns: new[] { "ai_card_id", "sort_key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_scenes_storage_key",
                schema: "soul",
                table: "ai_card_scenes",
                column: "storage_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_scenes_user_card",
                schema: "soul",
                table: "ai_card_scenes",
                columns: new[] { "user_id", "ai_card_id" });

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_tools_card",
                schema: "soul",
                table: "ai_card_tools",
                column: "ai_card_id");

            migrationBuilder.CreateIndex(
                name: "IX_ai_card_tools_ai_card_id_tool_name",
                schema: "soul",
                table: "ai_card_tools",
                columns: new[] { "ai_card_id", "tool_name" },
                unique: true);
        }
    }
}
