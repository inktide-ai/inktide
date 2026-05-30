using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Marketplace.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddConnectorApplicationId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "application_id",
                schema: "marketplace",
                table: "connectors",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "application_id", schema: "marketplace", table: "connectors");
        }
    }
}
