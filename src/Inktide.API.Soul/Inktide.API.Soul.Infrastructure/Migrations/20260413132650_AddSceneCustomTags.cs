using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSceneCustomTags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "tag",
                schema: "soul",
                table: "ai_card_scenes",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ai_card_custom_scene_tags",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    ai_card_id = table.Column<Guid>(type: "uuid", nullable: false),
                    label = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    label_normalized = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_card_custom_scene_tags", x => x.id);
                    table.ForeignKey(
                        name: "FK_ai_card_custom_scene_tags_ai_cards_ai_card_id",
                        column: x => x.ai_card_id,
                        principalSchema: "soul",
                        principalTable: "ai_cards",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_custom_scene_tags_card",
                schema: "soul",
                table: "ai_card_custom_scene_tags",
                column: "ai_card_id");

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_custom_scene_tags_card_label_norm",
                schema: "soul",
                table: "ai_card_custom_scene_tags",
                columns: new[] { "ai_card_id", "label_normalized" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ai_card_custom_scene_tags",
                schema: "soul");

            migrationBuilder.DropColumn(
                name: "tag",
                schema: "soul",
                table: "ai_card_scenes");
        }
    }
}
