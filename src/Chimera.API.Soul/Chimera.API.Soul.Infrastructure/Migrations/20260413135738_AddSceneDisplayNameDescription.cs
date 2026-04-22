using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chimera.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSceneDisplayNameDescription : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "description",
                schema: "soul",
                table: "ai_card_scenes",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "display_name",
                schema: "soul",
                table: "ai_card_scenes",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "description",
                schema: "soul",
                table: "ai_card_scenes");

            migrationBuilder.DropColumn(
                name: "display_name",
                schema: "soul",
                table: "ai_card_scenes");
        }
    }
}
