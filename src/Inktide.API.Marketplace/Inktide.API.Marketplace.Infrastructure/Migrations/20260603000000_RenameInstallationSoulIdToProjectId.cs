using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Marketplace.Infrastructure.Migrations
{
    public partial class RenameInstallationSoulIdToProjectId : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_connector_installations_soul_id_connector_id",
                schema: "marketplace",
                table: "connector_installations");

            migrationBuilder.RenameColumn(
                name: "soul_id",
                schema: "marketplace",
                table: "connector_installations",
                newName: "project_id");

            migrationBuilder.CreateIndex(
                name: "IX_connector_installations_project_id_connector_id",
                schema: "marketplace",
                table: "connector_installations",
                columns: new[] { "project_id", "connector_id" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_connector_installations_project_id_connector_id",
                schema: "marketplace",
                table: "connector_installations");

            migrationBuilder.RenameColumn(
                name: "project_id",
                schema: "marketplace",
                table: "connector_installations",
                newName: "soul_id");

            migrationBuilder.CreateIndex(
                name: "IX_connector_installations_soul_id_connector_id",
                schema: "marketplace",
                table: "connector_installations",
                columns: new[] { "soul_id", "connector_id" },
                unique: true);
        }
    }
}
