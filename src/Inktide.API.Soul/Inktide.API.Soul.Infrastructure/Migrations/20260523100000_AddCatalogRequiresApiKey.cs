using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    [DbContext(typeof(SoulDbContext))]
    [Migration("20260523100000_AddCatalogRequiresApiKey")]
    public partial class AddCatalogRequiresApiKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "requires_api_key",
                schema: "soul",
                table: "llm_catalog",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "requires_api_key",
                schema: "soul",
                table: "tts_catalog",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            // Seed: local/self-hosted providers do not require a BYOK key.
            migrationBuilder.Sql("""
                UPDATE soul.llm_catalog
                SET requires_api_key = false
                WHERE provider IN ('ollama', 'lm-studio', 'llamacpp', 'llamafile');

                UPDATE soul.tts_catalog
                SET requires_api_key = false
                WHERE provider IN ('kokoro', 'piper', 'coqui');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "requires_api_key",
                schema: "soul",
                table: "llm_catalog");

            migrationBuilder.DropColumn(
                name: "requires_api_key",
                schema: "soul",
                table: "tts_catalog");
        }
    }
}
