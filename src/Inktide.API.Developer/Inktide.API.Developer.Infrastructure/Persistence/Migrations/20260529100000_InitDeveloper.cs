using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Developer.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitDeveloper : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(name: "developer");

            migrationBuilder.CreateTable(
                name: "applications",
                schema: "developer",
                columns: table => new
                {
                    id                  = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_user_id       = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    name                = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    description         = table.Column<string>(type: "text", nullable: true),
                    icon_url            = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    keycloak_client_id  = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    client_secret_hash  = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    redirect_uris       = table.Column<string[]>(type: "text[]", nullable: false),
                    webhook_url         = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    webhook_secret_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    scopes              = table.Column<string[]>(type: "text[]", nullable: false),
                    status              = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false, defaultValue: "active"),
                    connector_slug      = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    created_at          = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at          = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_applications", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "webhook_deliveries",
                schema: "developer",
                columns: table => new
                {
                    id              = table.Column<Guid>(type: "uuid", nullable: false),
                    application_id  = table.Column<Guid>(type: "uuid", nullable: false),
                    event_type      = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    payload_json    = table.Column<string>(type: "jsonb", nullable: false),
                    status_code     = table.Column<int>(type: "integer", nullable: true),
                    response_body   = table.Column<string>(type: "text", nullable: true),
                    attempt         = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    delivered_at    = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    next_retry_at   = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at      = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_webhook_deliveries", x => x.id);
                    table.ForeignKey(
                        name: "FK_webhook_deliveries_applications_application_id",
                        column: x => x.application_id,
                        principalSchema: "developer",
                        principalTable: "applications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_applications_keycloak_client_id",
                schema: "developer",
                table: "applications",
                column: "keycloak_client_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_applications_owner_user_id",
                schema: "developer",
                table: "applications",
                column: "owner_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_webhook_deliveries_application_id",
                schema: "developer",
                table: "webhook_deliveries",
                column: "application_id");

            migrationBuilder.CreateIndex(
                name: "IX_webhook_deliveries_next_retry_at",
                schema: "developer",
                table: "webhook_deliveries",
                column: "next_retry_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "webhook_deliveries", schema: "developer");
            migrationBuilder.DropTable(name: "applications", schema: "developer");
        }
    }
}
