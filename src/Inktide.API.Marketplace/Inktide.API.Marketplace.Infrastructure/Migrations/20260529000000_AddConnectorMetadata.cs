using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814

namespace Inktide.API.Marketplace.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddConnectorMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "short_description",
                schema: "marketplace",
                table: "connectors",
                type: "character varying(256)",
                maxLength: 256,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "auth_type",
                schema: "marketplace",
                table: "connectors",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "none");

            migrationBuilder.AddColumn<bool>(
                name: "is_native",
                schema: "marketplace",
                table: "connectors",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "author_name",
                schema: "marketplace",
                table: "connectors",
                type: "character varying(128)",
                maxLength: 128,
                nullable: false,
                defaultValue: "Inktide");

            migrationBuilder.AddColumn<string>(
                name: "website_url",
                schema: "marketplace",
                table: "connectors",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.UpdateData(
                schema: "marketplace",
                table: "connectors",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                columns: new[] { "short_description", "auth_type", "is_native", "author_name", "website_url" },
                values: new object[] { "Route guild messages to your AI character", "oauth", true, "Inktide", null });

            migrationBuilder.UpdateData(
                schema: "marketplace",
                table: "connectors",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000002"),
                columns: new[] { "short_description", "auth_type", "is_native", "author_name", "website_url" },
                values: new object[] { "Read and respond to Twitch chat live", "oauth", true, "Inktide", null });

            migrationBuilder.UpdateData(
                schema: "marketplace",
                table: "connectors",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000003"),
                columns: new[] { "short_description", "auth_type", "is_native", "author_name", "website_url" },
                values: new object[] { "Telegram bot token — no OAuth needed", "apikey", true, "Inktide", null });

            migrationBuilder.UpdateData(
                schema: "marketplace",
                table: "connectors",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000004"),
                columns: new[] { "short_description", "auth_type", "is_native", "author_name", "website_url" },
                values: new object[] { "YouTube Live chat (coming soon)", "oauth", false, "Inktide", "https://youtube.com" });

            migrationBuilder.UpdateData(
                schema: "marketplace",
                table: "connectors",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000005"),
                columns: new[] { "short_description", "auth_type", "is_native", "author_name", "website_url" },
                values: new object[] { "TikTok LIVE comments (coming soon)", "webhook", false, "Inktide", "https://developers.tiktok.com" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "short_description", schema: "marketplace", table: "connectors");
            migrationBuilder.DropColumn(name: "auth_type",         schema: "marketplace", table: "connectors");
            migrationBuilder.DropColumn(name: "is_native",         schema: "marketplace", table: "connectors");
            migrationBuilder.DropColumn(name: "author_name",       schema: "marketplace", table: "connectors");
            migrationBuilder.DropColumn(name: "website_url",       schema: "marketplace", table: "connectors");
        }
    }
}
