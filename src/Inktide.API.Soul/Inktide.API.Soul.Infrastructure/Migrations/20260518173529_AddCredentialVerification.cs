using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCredentialVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "last_error",
                schema: "soul",
                table: "user_provider_credentials",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "verified_at",
                schema: "soul",
                table: "user_provider_credentials",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "last_error",
                schema: "soul",
                table: "user_provider_credentials");

            migrationBuilder.DropColumn(
                name: "verified_at",
                schema: "soul",
                table: "user_provider_credentials");
        }
    }
}
