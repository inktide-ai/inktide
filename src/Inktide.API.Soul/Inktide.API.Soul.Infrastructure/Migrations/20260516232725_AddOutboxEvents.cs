using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOutboxEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // memory_metadata and user_profiles remain in the DB - they are now owned by
            // MemoryDbContext and ProfileDbContext respectively (R4/R5). Do NOT drop them here.

            migrationBuilder.AddColumn<string>(
                name: "refresh_token_enc",
                schema: "soul",
                table: "ai_card_channels",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "token_expires_at",
                schema: "soul",
                table: "ai_card_channels",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "outbox_events",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    payload = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    processed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    error = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_outbox_events", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "idx_outbox_unprocessed",
                schema: "soul",
                table: "outbox_events",
                column: "processed_at",
                filter: "processed_at IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "outbox_events",
                schema: "soul");

            migrationBuilder.DropColumn(
                name: "refresh_token_enc",
                schema: "soul",
                table: "ai_card_channels");

            migrationBuilder.DropColumn(
                name: "token_expires_at",
                schema: "soul",
                table: "ai_card_channels");

            migrationBuilder.CreateTable(
                name: "memory_metadata",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    ai_card_id = table.Column<Guid>(type: "uuid", nullable: false),
                    category = table.Column<string>(type: "text", nullable: false, defaultValue: "general"),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    fact_text = table.Column<string>(type: "text", nullable: false),
                    importance = table.Column<double>(type: "double precision", nullable: false, defaultValue: 0.5),
                    last_recalled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    qdrant_point_id = table.Column<string>(type: "text", nullable: false),
                    recall_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    remembered_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    source_type = table.Column<string>(type: "text", nullable: false, defaultValue: "chat")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_memory_metadata", x => x.id);
                    table.ForeignKey(
                        name: "FK_memory_metadata_ai_cards_ai_card_id",
                        column: x => x.ai_card_id,
                        principalSchema: "soul",
                        principalTable: "ai_cards",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_profiles",
                schema: "soul",
                columns: table => new
                {
                    user_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    avatar_url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_profiles", x => x.user_id);
                });

            migrationBuilder.CreateIndex(
                name: "idx_memory_card",
                schema: "soul",
                table: "memory_metadata",
                column: "ai_card_id");

            migrationBuilder.CreateIndex(
                name: "idx_memory_category",
                schema: "soul",
                table: "memory_metadata",
                columns: new[] { "ai_card_id", "category" });

            migrationBuilder.CreateIndex(
                name: "idx_memory_expiry",
                schema: "soul",
                table: "memory_metadata",
                column: "expires_at",
                filter: "expires_at IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "idx_memory_importance",
                schema: "soul",
                table: "memory_metadata",
                columns: new[] { "ai_card_id", "importance" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_memory_metadata_ai_card_id_qdrant_point_id",
                schema: "soul",
                table: "memory_metadata",
                columns: new[] { "ai_card_id", "qdrant_point_id" },
                unique: true);
        }
    }
}
