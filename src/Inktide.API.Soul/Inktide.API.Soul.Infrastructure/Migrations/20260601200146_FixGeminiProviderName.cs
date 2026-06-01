using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixGeminiProviderName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ai_cards_llm_catalog_llm_catalog_id",
                schema: "soul",
                table: "ai_cards");

            migrationBuilder.AddForeignKey(
                name: "FK_ai_cards_llm_catalog_llm_catalog_id",
                schema: "soul",
                table: "ai_cards",
                column: "llm_catalog_id",
                principalSchema: "soul",
                principalTable: "llm_catalog",
                principalColumn: "id");

            // Align catalog provider name with frontend LLM_PROVIDER_CATALOG (id: 'gemini').
            migrationBuilder.Sql("UPDATE soul.llm_catalog SET provider = 'gemini' WHERE provider = 'google';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE soul.llm_catalog SET provider = 'google' WHERE provider = 'gemini';");

            migrationBuilder.DropForeignKey(
                name: "FK_ai_cards_llm_catalog_llm_catalog_id",
                schema: "soul",
                table: "ai_cards");

            migrationBuilder.AddForeignKey(
                name: "FK_ai_cards_llm_catalog_llm_catalog_id",
                schema: "soul",
                table: "ai_cards",
                column: "llm_catalog_id",
                principalSchema: "soul",
                principalTable: "llm_catalog",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
