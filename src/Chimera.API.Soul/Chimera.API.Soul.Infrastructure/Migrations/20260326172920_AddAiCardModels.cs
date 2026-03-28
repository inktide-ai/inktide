using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chimera.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAiCardModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ai_card_models",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    ai_card_id = table.Column<Guid>(type: "uuid", nullable: false),
                    storage_key = table.Column<string>(type: "text", nullable: false),
                    public_url = table.Column<string>(type: "text", nullable: false),
                    original_file_name = table.Column<string>(type: "text", nullable: false),
                    content_type = table.Column<string>(type: "text", nullable: false),
                    size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_card_models", x => x.id);
                    table.ForeignKey(
                        name: "FK_ai_card_models_ai_cards_ai_card_id",
                        column: x => x.ai_card_id,
                        principalSchema: "soul",
                        principalTable: "ai_cards",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_models_card",
                schema: "soul",
                table: "ai_card_models",
                column: "ai_card_id");

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_models_storage_key",
                schema: "soul",
                table: "ai_card_models",
                column: "storage_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_models_user_card",
                schema: "soul",
                table: "ai_card_models",
                columns: new[] { "user_id", "ai_card_id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ai_card_models",
                schema: "soul");
        }
    }
}
