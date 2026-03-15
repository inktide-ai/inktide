using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chimera.API.Identify.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOAuthExternalIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "google_id",
                schema: "gateway",
                table: "users",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "twitch_id",
                schema: "gateway",
                table: "users",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_google_id",
                schema: "gateway",
                table: "users",
                column: "google_id",
                unique: true,
                filter: "google_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_users_twitch_id",
                schema: "gateway",
                table: "users",
                column: "twitch_id",
                unique: true,
                filter: "twitch_id IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_users_google_id",
                schema: "gateway",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_users_twitch_id",
                schema: "gateway",
                table: "users");

            migrationBuilder.DropColumn(
                name: "google_id",
                schema: "gateway",
                table: "users");

            migrationBuilder.DropColumn(
                name: "twitch_id",
                schema: "gateway",
                table: "users");
        }
    }
}
