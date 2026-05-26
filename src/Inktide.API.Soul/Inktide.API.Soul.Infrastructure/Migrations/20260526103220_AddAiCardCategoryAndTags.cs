using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAiCardCategoryAndTags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "category",
                schema: "soul",
                table: "ai_cards",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tags",
                schema: "soul",
                table: "ai_cards",
                type: "jsonb",
                nullable: false,
                defaultValueSql: "'[]'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "category",
                schema: "soul",
                table: "ai_cards");

            migrationBuilder.DropColumn(
                name: "tags",
                schema: "soul",
                table: "ai_cards");
        }
    }
}
