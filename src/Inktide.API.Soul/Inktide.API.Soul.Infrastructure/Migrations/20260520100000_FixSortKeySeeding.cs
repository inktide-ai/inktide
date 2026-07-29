using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    [DbContext(typeof(DbContext.SoulDbContext))]
    [Migration("20260520100000_FixSortKeySeeding")]
    public partial class FixSortKeySeeding : Migration
    {
        // The initial seeding migrations generated single-character sort keys (e.g. 'g', 'h', 'i')
        // which are invalid for FractionalIndexer: a key starting with 'i' expects an integer part
        // of length 10, but the key is only 1 character. This causes ArgumentException on reorder.
        // Fix: replace single-char keys with valid 2-char fractional-index keys ("a0", "a1", ...).

        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
WITH rn_data AS (
    SELECT id,
           (row_number() OVER (PARTITION BY user_id ORDER BY sort_key) - 1)::int AS rn
    FROM soul.ai_cards
    WHERE deleted_at IS NULL
      AND LENGTH(sort_key) < 2
),
keyed AS (
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
SET sort_key = k.new_key
FROM keyed k
WHERE p.id = k.id;");

            migrationBuilder.Sql(@"
WITH rn_data AS (
    SELECT id,
           (row_number() OVER (PARTITION BY ai_card_id ORDER BY sort_key) - 1)::int AS rn
    FROM soul.ai_card_scenes
    WHERE LENGTH(sort_key) < 2
),
keyed AS (
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
UPDATE soul.ai_card_scenes p
SET sort_key = k.new_key
FROM keyed k
WHERE p.id = k.id;");

            migrationBuilder.Sql(@"
WITH rn_data AS (
    SELECT id,
           (row_number() OVER (PARTITION BY ai_card_id ORDER BY sort_key) - 1)::int AS rn
    FROM soul.ai_card_run_presets
    WHERE LENGTH(sort_key) < 2
),
keyed AS (
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
SET sort_key = k.new_key
FROM keyed k
WHERE p.id = k.id;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Data-only fix - no structural rollback needed.
        }
    }
}
