using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemovePlansAndSubscriptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "subscriptions",
                schema: "soul");

            migrationBuilder.DropTable(
                name: "plans",
                schema: "soul");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "plans",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    allowed_model_tiers = table.Column<string[]>(type: "text[]", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    display_name = table.Column<string>(type: "text", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    max_ai_cards = table.Column<int>(type: "integer", nullable: false),
                    max_memories = table.Column<int>(type: "integer", nullable: false, defaultValue: 500),
                    max_messages_day = table.Column<int>(type: "integer", nullable: false),
                    max_tokens_day = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    price_cents_month = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    price_cents_year = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_plans", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "subscriptions",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    cancelled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    current_period_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    external_sub_id = table.Column<string>(type: "text", nullable: true),
                    payment_provider = table.Column<string>(type: "text", nullable: true),
                    started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false, defaultValue: "active"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subscriptions", x => x.id);
                    table.ForeignKey(
                        name: "FK_subscriptions_plans_plan_id",
                        column: x => x.plan_id,
                        principalSchema: "soul",
                        principalTable: "plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_plans_name",
                schema: "soul",
                table: "plans",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_subscriptions_expiry",
                schema: "soul",
                table: "subscriptions",
                column: "current_period_end",
                filter: "status = 'active'");

            migrationBuilder.CreateIndex(
                name: "idx_subscriptions_user_active",
                schema: "soul",
                table: "subscriptions",
                column: "user_id",
                unique: true,
                filter: "status IN ('active', 'trialing')");

            migrationBuilder.CreateIndex(
                name: "IX_subscriptions_plan_id",
                schema: "soul",
                table: "subscriptions",
                column: "plan_id");
        }
    }
}
