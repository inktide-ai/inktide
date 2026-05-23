using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations;

public partial class AddDiscordOAuthTokenFields : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // columns were already added in AddOutboxEvents (20260516232725)
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
    }
}
