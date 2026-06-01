using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSoulActivityFeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "soul_activity_feed",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    ai_card_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    visibility = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "PUBLIC"),
                    rendered_copy = table.Column<string>(type: "text", nullable: false),
                    emoji = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    metadata = table.Column<string>(type: "jsonb", nullable: true),
                    occurred_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_soul_activity_feed", x => x.id);
                    table.ForeignKey(
                        name: "FK_soul_activity_feed_ai_cards_ai_card_id",
                        column: x => x.ai_card_id,
                        principalSchema: "soul",
                        principalTable: "ai_cards",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_saf_card_type_time",
                schema: "soul",
                table: "soul_activity_feed",
                columns: new[] { "ai_card_id", "event_type", "occurred_at" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "idx_saf_card_visibility_time",
                schema: "soul",
                table: "soul_activity_feed",
                columns: new[] { "ai_card_id", "visibility", "occurred_at" },
                descending: new[] { false, false, true });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "soul_activity_feed",
                schema: "soul");
        }
    }
}
