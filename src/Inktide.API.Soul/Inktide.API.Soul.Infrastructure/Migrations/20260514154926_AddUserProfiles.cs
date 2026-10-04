using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // user_profiles is now owned by ProfileDbContext, whose InitialCreate creates the same
            // table idempotently and may run first on a fresh database.
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
                name: "user_profiles",
                schema: "soul");
        }
    }
}
