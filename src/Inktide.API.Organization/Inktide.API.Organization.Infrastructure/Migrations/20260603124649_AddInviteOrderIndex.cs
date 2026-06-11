using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Organization.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInviteOrderIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "idx_org_invite_org_status_created",
                schema: "organization",
                table: "organization_invites",
                columns: new[] { "organization_id", "status", "created_at" },
                filter: "status = 'Pending'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_org_invite_org_status_created",
                schema: "organization",
                table: "organization_invites");
        }
    }
}
