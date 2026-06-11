using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectIdToAiCardChannels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Applied by Phase 2 SQL migration.
            // This file exists only to sync the EF snapshot.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ai_card_channels_project_id_platform_channel_name",
                schema: "soul",
                table: "ai_card_channels");

            migrationBuilder.DropColumn(
                name: "project_id",
                schema: "soul",
                table: "ai_card_channels");

            migrationBuilder.CreateIndex(
                name: "IX_ai_card_channels_ai_card_id_platform_channel_name",
                schema: "soul",
                table: "ai_card_channels",
                columns: new[] { "ai_card_id", "platform", "channel_name" },
                unique: true);
        }
    }
}
