using Inktide.API.Marketplace.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814

namespace Inktide.API.Marketplace.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(MarketplaceDbContext))]
    [Migration("20260529000000_AddConnectorMetadata")]
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

            // Raw SQL rather than UpdateData: this hand-written migration has no target model,
            // so EF cannot resolve the column types UpdateData needs.
            migrationBuilder.Sql("""
                UPDATE marketplace.connectors
                SET short_description = 'Route guild messages to your AI character', auth_type = 'oauth', is_native = true,
                    author_name = 'Inktide', website_url = NULL
                WHERE id = '00000000-0000-0000-0000-000000000001'
                """);

            migrationBuilder.Sql("""
                UPDATE marketplace.connectors
                SET short_description = 'Read and respond to Twitch chat live', auth_type = 'oauth', is_native = true,
                    author_name = 'Inktide', website_url = NULL
                WHERE id = '00000000-0000-0000-0000-000000000002'
                """);

            migrationBuilder.Sql("""
                UPDATE marketplace.connectors
                SET short_description = 'Telegram bot token — no OAuth needed', auth_type = 'apikey', is_native = true,
                    author_name = 'Inktide', website_url = NULL
                WHERE id = '00000000-0000-0000-0000-000000000003'
                """);

            migrationBuilder.Sql("""
                UPDATE marketplace.connectors
                SET short_description = 'YouTube Live chat (coming soon)', auth_type = 'oauth', is_native = false,
                    author_name = 'Inktide', website_url = 'https://youtube.com'
                WHERE id = '00000000-0000-0000-0000-000000000004'
                """);

            migrationBuilder.Sql("""
                UPDATE marketplace.connectors
                SET short_description = 'TikTok LIVE comments (coming soon)', auth_type = 'webhook', is_native = false,
                    author_name = 'Inktide', website_url = 'https://developers.tiktok.com'
                WHERE id = '00000000-0000-0000-0000-000000000005'
                """);
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
