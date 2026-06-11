using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Billing.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSubscriptionExpiryIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "idx_billing_sub_status_period_end",
                schema: "billing",
                table: "user_subscriptions",
                columns: new[] { "status", "current_period_end" },
                filter: "status IN ('Active', 'Trialing')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_billing_sub_status_period_end",
                schema: "billing",
                table: "user_subscriptions");
        }
    }
}
