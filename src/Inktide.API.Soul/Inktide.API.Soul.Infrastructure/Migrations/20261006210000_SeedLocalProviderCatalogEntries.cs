using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <summary>
    /// Catalog entries for the local providers besides Ollama. SoulCreationGuard requires the
    /// card's provider to match its catalog entry, so without these rows LM Studio, Jan, LocalAI,
    /// vLLM and llama.cpp souls could not be created. They need no API key, and the model is the
    /// one typed into llm_config.model_id; "custom" is only the placeholder the catalog needs.
    /// </summary>
    [DbContext(typeof(SoulDbContext))]
    [Migration("20261006210000_SeedLocalProviderCatalogEntries")]
    public partial class SeedLocalProviderCatalogEntries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                INSERT INTO soul.llm_catalog (id, provider, model_id, display_name, tier, is_available, created_at, requires_api_key) VALUES
                  ('11111111-0009-0000-0000-000000000001', 'lmstudio', 'custom', 'Custom model (LM Studio)', 'free', true, '2026-10-06T00:00:00Z', false),
                  ('11111111-0009-0000-0000-000000000002', 'jan',      'custom', 'Custom model (Jan)',       'free', true, '2026-10-06T00:00:00Z', false),
                  ('11111111-0009-0000-0000-000000000003', 'localai',  'custom', 'Custom model (LocalAI)',   'free', true, '2026-10-06T00:00:00Z', false),
                  ('11111111-0009-0000-0000-000000000004', 'vllm',     'custom', 'Custom model (vLLM)',      'free', true, '2026-10-06T00:00:00Z', false),
                  ('11111111-0009-0000-0000-000000000005', 'llamacpp', 'custom', 'Custom model (llama.cpp)', 'free', true, '2026-10-06T00:00:00Z', false)
                ON CONFLICT DO NOTHING;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM soul.llm_catalog WHERE id::text LIKE '11111111-0009-%'");
        }
    }
}
