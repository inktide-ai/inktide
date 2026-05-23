using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    [DbContext(typeof(DbContext.SoulDbContext))]
    [Migration("20260520000000_AddScreenAwareness")]
    public partial class AddScreenAwareness : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "screen_awareness_settings",
                schema: "soul",
                table: "ai_cards",
                type: "jsonb",
                nullable: false,
                defaultValueSql: "'{}'");

            migrationBuilder.AddColumn<int>(
                name: "vision_frames_processed",
                schema: "soul",
                table: "usage_daily",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "vision_events_detected",
                schema: "soul",
                table: "usage_daily",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "screen_awareness_settings",
                schema: "soul",
                table: "ai_cards");

            migrationBuilder.DropColumn(
                name: "vision_frames_processed",
                schema: "soul",
                table: "usage_daily");

            migrationBuilder.DropColumn(
                name: "vision_events_detected",
                schema: "soul",
                table: "usage_daily");
        }
    }
}
