using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    [DbContext(typeof(SoulDbContext))]
    [Migration("20260521120000_AddAiCardModelIsActive")]
    public partial class AddAiCardModelIsActive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                schema: "soul",
                table: "ai_card_models",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Backfill: mark the most-recently-uploaded model per card as active.
            migrationBuilder.Sql("""
                UPDATE soul.ai_card_models SET is_active = true
                WHERE id IN (
                    SELECT DISTINCT ON (ai_card_id) id
                    FROM soul.ai_card_models
                    ORDER BY ai_card_id, created_at DESC
                );
                """);

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_models_active",
                schema: "soul",
                table: "ai_card_models",
                columns: ["ai_card_id", "is_active"]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_ai_card_models_active",
                schema: "soul",
                table: "ai_card_models");

            migrationBuilder.DropColumn(
                name: "is_active",
                schema: "soul",
                table: "ai_card_models");
        }
    }
}
