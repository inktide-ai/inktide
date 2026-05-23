using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPresetSortKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "sort_key",
                schema: "soul",
                table: "ai_card_run_presets",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "a0");

            // Assign distinct initial sort keys to existing rows ordered by created_at per card.
            migrationBuilder.Sql(@"
WITH rn_data AS (
    SELECT id,
           (row_number() OVER (PARTITION BY ai_card_id ORDER BY created_at) - 1)::int AS rn
    FROM soul.ai_card_run_presets
    WHERE sort_key = 'a0'
),
ranked AS (
    SELECT id,
           'a'::text || chr(
               CASE
                   WHEN rn < 10 THEN 48 + rn
                   WHEN rn < 36 THEN 55 + rn
                   ELSE 61 + rn
               END
           ) AS new_key
    FROM rn_data
)
UPDATE soul.ai_card_run_presets p
SET sort_key = r.new_key
FROM ranked r
WHERE p.id = r.id;");

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_run_presets_sort",
                schema: "soul",
                table: "ai_card_run_presets",
                columns: new[] { "ai_card_id", "sort_key" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_ai_card_run_presets_sort",
                schema: "soul",
                table: "ai_card_run_presets");

            migrationBuilder.DropColumn(
                name: "sort_key",
                schema: "soul",
                table: "ai_card_run_presets");
        }
    }
}
