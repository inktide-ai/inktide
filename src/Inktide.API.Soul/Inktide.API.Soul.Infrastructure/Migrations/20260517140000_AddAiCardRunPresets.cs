using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations;

public partial class AddAiCardRunPresets : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "ai_card_run_presets",
            schema: "soul",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                user_id = table.Column<Guid>(type: "uuid", nullable: false),
                ai_card_id = table.Column<Guid>(type: "uuid", nullable: false),
                name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                icon = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                override_llm_model_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                override_temperature = table.Column<float>(type: "real", nullable: true),
                override_emotion_preset_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                override_voice_profile_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ai_card_run_presets", x => x.id);
                table.ForeignKey(
                    name: "FK_ai_card_run_presets_ai_cards_ai_card_id",
                    column: x => x.ai_card_id,
                    principalSchema: "soul",
                    principalTable: "ai_cards",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "idx_ai_card_run_presets_card",
            schema: "soul",
            table: "ai_card_run_presets",
            column: "ai_card_id");

        migrationBuilder.CreateIndex(
            name: "idx_ai_card_run_presets_user_card",
            schema: "soul",
            table: "ai_card_run_presets",
            columns: new[] { "user_id", "ai_card_id" });

        // Unique partial index: at most one active preset per card.
        migrationBuilder.Sql(
            "CREATE UNIQUE INDEX idx_ai_card_run_presets_active " +
            "ON soul.ai_card_run_presets (ai_card_id) " +
            "WHERE is_active = true;");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "ai_card_run_presets", schema: "soul");
    }
}
