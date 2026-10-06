using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <summary>
    /// Catalog entry for the "OpenAI-compatible" provider (RouterAI, vLLM, LocalAI and the like).
    /// SoulCreationGuard requires the card's provider to match its catalog entry, so without this
    /// row such souls could not be created. The model is whatever the user types into llm_config.model_id;
    /// "custom" is only the placeholder the catalog needs.
    /// </summary>
    [DbContext(typeof(SoulDbContext))]
    [Migration("20261006190000_SeedOpenAiCompatCatalogEntry")]
    public partial class SeedOpenAiCompatCatalogEntry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                INSERT INTO soul.llm_catalog (id, provider, model_id, display_name, tier, is_available, created_at, requires_api_key) VALUES
                  ('11111111-0008-0000-0000-000000000001', 'openai-compat', 'custom', 'Custom model (OpenAI-compatible)', 'free', true, '2026-10-06T00:00:00Z', true)
                ON CONFLICT DO NOTHING;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM soul.llm_catalog WHERE id = '11111111-0008-0000-0000-000000000001'");
        }
    }
}
