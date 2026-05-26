using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOutboxEventRetryCount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "retry_count",
                schema: "soul",
                table: "outbox_events",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "retry_count",
                schema: "soul",
                table: "outbox_events");
        }
    }
}
