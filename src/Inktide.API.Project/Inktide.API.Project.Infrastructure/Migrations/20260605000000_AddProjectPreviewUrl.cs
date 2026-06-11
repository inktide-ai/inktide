using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Project.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectPreviewUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "preview_url",
                schema: "project",
                table: "projects",
                type: "character varying(1024)",
                maxLength: 1024,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "preview_url",
                schema: "project",
                table: "projects");
        }
    }
}
