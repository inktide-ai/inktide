using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Project.Infrastructure.Migrations
{
    // Data migration only — no DDL changes.
    // Idempotent: WHERE sort_key = 'a0' and LENGTH < 2 guards prevent double-apply.
    public partial class SeedProjectSortKeys : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Assign distinct initial sort keys to rows that still have the default 'a0'.
            migrationBuilder.Sql("""
                WITH rn_data AS (
                    SELECT id,
                           (row_number() OVER (PARTITION BY user_id ORDER BY updated_at) - 1)::int AS rn
                    FROM project.projects
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
                UPDATE project.projects p
                SET sort_key = r.new_key
                FROM ranked r
                WHERE p.id = r.id
                """);

            // Fix single-char sort keys (invalid for FractionalIndexer — expects length >= 2).
            migrationBuilder.Sql("""
                WITH rn_data AS (
                    SELECT id,
                           (row_number() OVER (PARTITION BY user_id ORDER BY sort_key) - 1)::int AS rn
                    FROM project.projects
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
                UPDATE project.projects p
                SET sort_key = k.new_key
                FROM keyed k
                WHERE p.id = k.id
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Data-only fix — no structural rollback.
        }
    }
}
