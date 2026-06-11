using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Marketplace.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddConnectorCatalogIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "idx_connectors_category",
                schema: "marketplace",
                table: "connectors",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "idx_connectors_is_available",
                schema: "marketplace",
                table: "connectors",
                column: "is_available",
                filter: "is_available = true");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_connectors_category",
                schema: "marketplace",
                table: "connectors");

            migrationBuilder.DropIndex(
                name: "idx_connectors_is_available",
                schema: "marketplace",
                table: "connectors");
        }
    }
}
