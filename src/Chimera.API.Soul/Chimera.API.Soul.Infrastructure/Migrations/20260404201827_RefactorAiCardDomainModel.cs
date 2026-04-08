using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chimera.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RefactorAiCardDomainModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_ai_cards_user_active",
                schema: "soul",
                table: "ai_cards");

            // donkey_engine → auto_pilot (rename only, no data change)
            migrationBuilder.RenameColumn(
                name: "donkey_engine",
                schema: "soul",
                table: "ai_cards",
                newName: "auto_pilot");

            // behavior → response_behavior (will extract visual fields into appearance below)
            migrationBuilder.RenameColumn(
                name: "behavior",
                schema: "soul",
                table: "ai_cards",
                newName: "response_behavior");

            migrationBuilder.AddColumn<string>(
                name: "appearance",
                schema: "soul",
                table: "ai_cards",
                type: "jsonb",
                nullable: false,
                defaultValue: "{}");

            // Populate appearance from old behavior blob
            migrationBuilder.Sql("""
                UPDATE soul.ai_cards
                SET appearance = jsonb_build_object(
                    'banner_color_index', COALESCE((response_behavior->>'banner_color_index')::int, 0),
                    'model_type',         COALESCE(response_behavior->>'model_type', 'none'),
                    'model_file_name',    response_behavior->>'model_file_name',
                    'key_phrases',        COALESCE(response_behavior->>'key_phrases', '')
                );
                """);

            // Remove visual fields from response_behavior — keep only runtime fields
            migrationBuilder.Sql("""
                UPDATE soul.ai_cards
                SET response_behavior = response_behavior
                    - 'banner_color_index'
                    - 'model_type'
                    - 'model_file_name'
                    - 'key_phrases';
                """);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                schema: "soul",
                table: "ai_cards",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "visibility",
                schema: "soul",
                table: "ai_cards",
                type: "text",
                nullable: false,
                defaultValue: "private");

            migrationBuilder.CreateIndex(
                name: "idx_ai_cards_deleted_at",
                schema: "soul",
                table: "ai_cards",
                column: "deleted_at",
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "idx_ai_cards_user_active",
                schema: "soul",
                table: "ai_cards",
                columns: new[] { "user_id", "is_active" },
                filter: "is_active = true AND deleted_at IS NULL");

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_ai_cards_deleted_at",
                schema: "soul",
                table: "ai_cards");

            migrationBuilder.DropIndex(
                name: "idx_ai_cards_user_active",
                schema: "soul",
                table: "ai_cards");

            migrationBuilder.DropColumn(
                name: "appearance",
                schema: "soul",
                table: "ai_cards");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                schema: "soul",
                table: "ai_cards");

            migrationBuilder.DropColumn(
                name: "visibility",
                schema: "soul",
                table: "ai_cards");

            migrationBuilder.RenameColumn(
                name: "auto_pilot",
                schema: "soul",
                table: "ai_cards",
                newName: "donkey_engine");

            migrationBuilder.RenameColumn(
                name: "response_behavior",
                schema: "soul",
                table: "ai_cards",
                newName: "behavior");

            migrationBuilder.CreateIndex(
                name: "idx_ai_cards_user_active",
                schema: "soul",
                table: "ai_cards",
                columns: new[] { "user_id", "is_active" },
                filter: "is_active = true");
        }
    }
}
