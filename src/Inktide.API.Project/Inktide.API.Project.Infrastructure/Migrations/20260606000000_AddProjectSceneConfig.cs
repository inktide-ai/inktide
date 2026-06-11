using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Project.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectSceneConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "scene_config",
                schema: "project",
                table: "projects",
                type: "jsonb",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "scene_config",
                schema: "project",
                table: "projects");
        }
    }
}
