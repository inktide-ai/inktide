using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Profile.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Idempotent: safe to run on existing databases created by the old EnsureCreated initializer.
            migrationBuilder.Sql("CREATE SCHEMA IF NOT EXISTS soul");

            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS soul.user_preferences (
                    user_id        character varying(64)    NOT NULL,
                    appearance     jsonb                    NOT NULL,
                    language       character varying(16)    NOT NULL DEFAULT 'en',
                    notifications  jsonb                    NOT NULL,
                    favorites      text[]                   NOT NULL,
                    hub_layouts    jsonb                    NOT NULL DEFAULT '{}',
                    scene_settings jsonb                    NOT NULL DEFAULT '{}',
                    updated_at     timestamptz              NOT NULL,
                    CONSTRAINT "PK_user_preferences" PRIMARY KEY (user_id)
                )
                """);

            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS soul.user_profiles (
                    user_id    character varying(64)   NOT NULL,
                    avatar_url character varying(2048),
                    CONSTRAINT "PK_user_profiles" PRIMARY KEY (user_id)
                )
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_preferences",
                schema: "soul");

            migrationBuilder.DropTable(
                name: "user_profiles",
                schema: "soul");
        }
    }
}
