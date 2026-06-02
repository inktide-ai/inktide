using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Organization.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Idempotent: safe to run on existing databases created by the old initializer.
            // Schema is created by OrganizationDbInitializer before MigrateAsync() to allow
            // EF's own __ef_org_migrations history table to be created in organization schema.

            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS organization.organizations (
                    id         uuid                     NOT NULL,
                    name       character varying(256)   NOT NULL,
                    owner_id   character varying(64)    NOT NULL,
                    created_at timestamptz              NOT NULL,
                    CONSTRAINT "PK_organizations" PRIMARY KEY (id)
                )
                """);

            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS organization.organization_invites (
                    id              uuid                   NOT NULL,
                    organization_id uuid                   NOT NULL,
                    email           character varying(256) NOT NULL,
                    role            character varying(16)  NOT NULL,
                    token           character varying(128) NOT NULL,
                    invited_by      character varying(64)  NOT NULL,
                    status          character varying(16)  NOT NULL,
                    expires_at      timestamptz            NOT NULL,
                    created_at      timestamptz            NOT NULL,
                    CONSTRAINT "PK_organization_invites" PRIMARY KEY (id),
                    CONSTRAINT "FK_organization_invites_organizations_organization_id"
                        FOREIGN KEY (organization_id)
                        REFERENCES organization.organizations(id)
                        ON DELETE CASCADE
                )
                """);

            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS organization.organization_members (
                    id              uuid                  NOT NULL,
                    organization_id uuid                  NOT NULL,
                    user_id         character varying(64) NOT NULL,
                    role            character varying(16) NOT NULL,
                    joined_at       timestamptz           NOT NULL,
                    CONSTRAINT "PK_organization_members" PRIMARY KEY (id),
                    CONSTRAINT "FK_organization_members_organizations_organization_id"
                        FOREIGN KEY (organization_id)
                        REFERENCES organization.organizations(id)
                        ON DELETE CASCADE
                )
                """);

            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS idx_org_invite_org_email_status ON organization.organization_invites (organization_id, email, status)");
            migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS idx_org_invite_token ON organization.organization_invites (token)");
            migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS idx_org_member_org_user ON organization.organization_members (organization_id, user_id)");
            migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS idx_org_owner_id ON organization.organizations (owner_id)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "organization_invites",
                schema: "organization");

            migrationBuilder.DropTable(
                name: "organization_members",
                schema: "organization");

            migrationBuilder.DropTable(
                name: "organizations",
                schema: "organization");
        }
    }
}
