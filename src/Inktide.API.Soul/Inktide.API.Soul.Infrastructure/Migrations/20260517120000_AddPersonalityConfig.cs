using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations;

[DbContext(typeof(SoulDbContext))]
[Migration("20260517120000_AddPersonalityConfig")]
public partial class AddPersonalityConfig : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "personality_config",
            schema: "soul",
            table: "ai_cards",
            type: "jsonb",
            nullable: false,
            defaultValueSql: "'{}'");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "personality_config",
            schema: "soul",
            table: "ai_cards");
    }
}
