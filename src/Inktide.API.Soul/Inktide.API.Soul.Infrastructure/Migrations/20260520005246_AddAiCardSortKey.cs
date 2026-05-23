using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAiCardSortKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "sort_key",
                schema: "soul",
                table: "ai_cards",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "a0");

            // Assign distinct initial sort keys to existing rows ordered by updated_at per user.
            migrationBuilder.Sql(@"
WITH rn_data AS (
    SELECT id,
           (row_number() OVER (PARTITION BY user_id ORDER BY updated_at) - 1)::int AS rn
    FROM soul.ai_cards
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
UPDATE soul.ai_cards p
SET sort_key = r.new_key
FROM ranked r
WHERE p.id = r.id;");

            migrationBuilder.CreateIndex(
                name: "idx_ai_cards_sort",
                schema: "soul",
                table: "ai_cards",
                columns: new[] { "user_id", "sort_key" },
                unique: true,
                filter: "deleted_at IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_ai_cards_sort",
                schema: "soul",
                table: "ai_cards");

            migrationBuilder.DropColumn(
                name: "sort_key",
                schema: "soul",
                table: "ai_cards");
        }
    }
}
