using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserProviderCredentials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "user_provider_credentials",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    provider_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    api_key_enc = table.Column<string>(type: "text", nullable: false),
                    base_url = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_provider_credentials", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "idx_user_provider_credentials_user",
                schema: "soul",
                table: "user_provider_credentials",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_user_provider_credentials_user_provider",
                schema: "soul",
                table: "user_provider_credentials",
                columns: new[] { "user_id", "provider_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_provider_credentials",
                schema: "soul");
        }
    }
}
