using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EnumValueConverters_AiCardStatusVisibility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "cover_url",
                schema: "soul",
                table: "ai_cards",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "description",
                schema: "soul",
                table: "ai_cards",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "status",
                schema: "soul",
                table: "ai_cards",
                type: "text",
                nullable: false,
                defaultValue: "active");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "cover_url",
                schema: "soul",
                table: "ai_cards");

            migrationBuilder.DropColumn(
                name: "description",
                schema: "soul",
                table: "ai_cards");

            migrationBuilder.DropColumn(
                name: "status",
                schema: "soul",
                table: "ai_cards");
        }
    }
}
