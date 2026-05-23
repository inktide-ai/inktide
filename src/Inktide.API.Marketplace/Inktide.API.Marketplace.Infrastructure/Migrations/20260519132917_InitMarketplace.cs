using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Inktide.API.Marketplace.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitMarketplace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "marketplace");

            migrationBuilder.CreateTable(
                name: "connectors",
                schema: "marketplace",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    description = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    category = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    icon_url = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    is_available = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_connectors", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "connector_installations",
                schema: "marketplace",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    soul_id = table.Column<Guid>(type: "uuid", nullable: false),
                    connector_id = table.Column<Guid>(type: "uuid", nullable: false),
                    installed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_connector_installations", x => x.id);
                    table.ForeignKey(
                        name: "FK_connector_installations_connectors_connector_id",
                        column: x => x.connector_id,
                        principalSchema: "marketplace",
                        principalTable: "connectors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                schema: "marketplace",
                table: "connectors",
                columns: new[] { "id", "category", "description", "icon_url", "is_available", "name", "slug", "sort_order" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0000-000000000001"), "Chat", "Route guild messages to your AI character in real-time.", "/icons/connectors/discord.svg", true, "Discord", "discord", 1 },
                    { new Guid("00000000-0000-0000-0000-000000000002"), "Stream", "Let your character react to live chat and stream events.", "/icons/connectors/twitch.svg", true, "Twitch", "twitch", 2 },
                    { new Guid("00000000-0000-0000-0000-000000000003"), "Chat", "Connect a Telegram bot to relay chat messages to your AI.", "/icons/connectors/telegram.svg", true, "Telegram", "telegram", 3 },
                    { new Guid("00000000-0000-0000-0000-000000000004"), "Stream", "Connect live stream chat to drive AI responses.", "/icons/connectors/youtube.svg", false, "YouTube", "youtube", 4 },
                    { new Guid("00000000-0000-0000-0000-000000000005"), "Stream", "Engage your TikTok live audience with AI replies.", "/icons/connectors/tiktok.svg", false, "TikTok", "tiktok", 5 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_connector_installations_connector_id",
                schema: "marketplace",
                table: "connector_installations",
                column: "connector_id");

            migrationBuilder.CreateIndex(
                name: "IX_connector_installations_soul_id_connector_id",
                schema: "marketplace",
                table: "connector_installations",
                columns: new[] { "soul_id", "connector_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_connectors_slug",
                schema: "marketplace",
                table: "connectors",
                column: "slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "connector_installations",
                schema: "marketplace");

            migrationBuilder.DropTable(
                name: "connectors",
                schema: "marketplace");
        }
    }
}
