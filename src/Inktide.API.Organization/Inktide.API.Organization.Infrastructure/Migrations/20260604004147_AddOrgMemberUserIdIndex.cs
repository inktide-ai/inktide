using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Organization.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOrgMemberUserIdIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "idx_org_member_user_id",
                schema: "organization",
                table: "organization_members",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_org_member_user_id",
                schema: "organization",
                table: "organization_members");
        }
    }
}
