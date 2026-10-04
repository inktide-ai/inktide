using Inktide.API.Project.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Project.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ProjectDbContext))]
    [Migration("20260605000000_AddProjectPreviewUrl")]
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
