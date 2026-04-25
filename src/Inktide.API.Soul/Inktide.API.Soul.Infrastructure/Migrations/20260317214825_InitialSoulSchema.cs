using System;
using System.Net;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialSoulSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "soul");

            migrationBuilder.CreateTable(
                name: "audit_log",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    entity_type = table.Column<string>(type: "text", nullable: false),
                    entity_id = table.Column<Guid>(type: "uuid", nullable: false),
                    action = table.Column<string>(type: "text", nullable: false),
                    changes = table.Column<string>(type: "jsonb", nullable: true),
                    ip_address = table.Column<IPAddress>(type: "inet", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_log", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "llm_catalog",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    provider = table.Column<string>(type: "text", nullable: false),
                    model_id = table.Column<string>(type: "text", nullable: false),
                    display_name = table.Column<string>(type: "text", nullable: false),
                    tier = table.Column<string>(type: "text", nullable: false, defaultValue: "free"),
                    is_available = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_llm_catalog", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "plans",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    display_name = table.Column<string>(type: "text", nullable: false),
                    max_ai_cards = table.Column<int>(type: "integer", nullable: false),
                    max_messages_day = table.Column<int>(type: "integer", nullable: false),
                    max_tokens_day = table.Column<int>(type: "integer", nullable: false),
                    max_memories = table.Column<int>(type: "integer", nullable: false, defaultValue: 500),
                    allowed_model_tiers = table.Column<string[]>(type: "text[]", nullable: false),
                    price_cents_month = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    price_cents_year = table.Column<int>(type: "integer", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_plans", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tts_catalog",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    provider = table.Column<string>(type: "text", nullable: false),
                    voice_id = table.Column<string>(type: "text", nullable: false),
                    display_name = table.Column<string>(type: "text", nullable: false),
                    language = table.Column<string>(type: "text", nullable: false, defaultValue: "en"),
                    gender = table.Column<string>(type: "text", nullable: true),
                    sample_url = table.Column<string>(type: "text", nullable: true),
                    tier = table.Column<string>(type: "text", nullable: false, defaultValue: "free"),
                    is_available = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tts_catalog", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "subscriptions",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false, defaultValue: "active"),
                    payment_provider = table.Column<string>(type: "text", nullable: true),
                    external_sub_id = table.Column<string>(type: "text", nullable: true),
                    started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    current_period_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    cancelled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
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

            migrationBuilder.CreateTable(
                name: "ai_cards",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    slug = table.Column<string>(type: "text", nullable: false),
                    avatar_url = table.Column<string>(type: "text", nullable: true),
                    personality = table.Column<string>(type: "text", nullable: false, defaultValue: ""),
                    system_prompt = table.Column<string>(type: "text", nullable: false),
                    llm_catalog_id = table.Column<Guid>(type: "uuid", nullable: false),
                    llm_config = table.Column<string>(type: "jsonb", nullable: false),
                    tts_catalog_id = table.Column<Guid>(type: "uuid", nullable: true),
                    tts_config = table.Column<string>(type: "jsonb", nullable: true),
                    behavior = table.Column<string>(type: "jsonb", nullable: false),
                    memory_settings = table.Column<string>(type: "jsonb", nullable: false),
                    donkey_engine = table.Column<string>(type: "jsonb", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_cards", x => x.id);
                    table.ForeignKey(
                        name: "FK_ai_cards_llm_catalog_llm_catalog_id",
                        column: x => x.llm_catalog_id,
                        principalSchema: "soul",
                        principalTable: "llm_catalog",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ai_cards_tts_catalog_tts_catalog_id",
                        column: x => x.tts_catalog_id,
                        principalSchema: "soul",
                        principalTable: "tts_catalog",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "ai_card_channels",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    ai_card_id = table.Column<Guid>(type: "uuid", nullable: false),
                    platform = table.Column<string>(type: "text", nullable: false, defaultValue: "twitch"),
                    channel_name = table.Column<string>(type: "text", nullable: false),
                    channel_id = table.Column<string>(type: "text", nullable: true),
                    bot_username = table.Column<string>(type: "text", nullable: false),
                    oauth_token_enc = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    connected_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_card_channels", x => x.id);
                    table.ForeignKey(
                        name: "FK_ai_card_channels_ai_cards_ai_card_id",
                        column: x => x.ai_card_id,
                        principalSchema: "soul",
                        principalTable: "ai_cards",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ai_card_tools",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    ai_card_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tool_name = table.Column<string>(type: "text", nullable: false),
                    tool_config = table.Column<string>(type: "jsonb", nullable: false),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_card_tools", x => x.id);
                    table.ForeignKey(
                        name: "FK_ai_card_tools_ai_cards_ai_card_id",
                        column: x => x.ai_card_id,
                        principalSchema: "soul",
                        principalTable: "ai_cards",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "memory_metadata",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    ai_card_id = table.Column<Guid>(type: "uuid", nullable: false),
                    qdrant_point_id = table.Column<string>(type: "text", nullable: false),
                    fact_text = table.Column<string>(type: "text", nullable: false),
                    category = table.Column<string>(type: "text", nullable: false, defaultValue: "general"),
                    source_type = table.Column<string>(type: "text", nullable: false, defaultValue: "chat"),
                    importance = table.Column<double>(type: "double precision", nullable: false, defaultValue: 0.5),
                    remembered_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_recalled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    recall_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_memory_metadata", x => x.id);
                    table.ForeignKey(
                        name: "FK_memory_metadata_ai_cards_ai_card_id",
                        column: x => x.ai_card_id,
                        principalSchema: "soul",
                        principalTable: "ai_cards",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "usage_daily",
                schema: "soul",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    ai_card_id = table.Column<Guid>(type: "uuid", nullable: false),
                    usage_date = table.Column<DateOnly>(type: "date", nullable: false),
                    llm_calls = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    tokens_prompt = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    tokens_completion = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    messages_received = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    messages_sent = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    tts_characters = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    donkey_thoughts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usage_daily", x => x.id);
                    table.ForeignKey(
                        name: "FK_usage_daily_ai_cards_ai_card_id",
                        column: x => x.ai_card_id,
                        principalSchema: "soul",
                        principalTable: "ai_cards",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_channels_active",
                schema: "soul",
                table: "ai_card_channels",
                columns: new[] { "platform", "is_active" },
                filter: "is_active = true");

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_channels_card",
                schema: "soul",
                table: "ai_card_channels",
                column: "ai_card_id");

            migrationBuilder.CreateIndex(
                name: "IX_ai_card_channels_ai_card_id_platform_channel_name",
                schema: "soul",
                table: "ai_card_channels",
                columns: new[] { "ai_card_id", "platform", "channel_name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_ai_card_tools_card",
                schema: "soul",
                table: "ai_card_tools",
                column: "ai_card_id");

            migrationBuilder.CreateIndex(
                name: "IX_ai_card_tools_ai_card_id_tool_name",
                schema: "soul",
                table: "ai_card_tools",
                columns: new[] { "ai_card_id", "tool_name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_ai_cards_user_active",
                schema: "soul",
                table: "ai_cards",
                columns: new[] { "user_id", "is_active" },
                filter: "is_active = true");

            migrationBuilder.CreateIndex(
                name: "idx_ai_cards_user_id",
                schema: "soul",
                table: "ai_cards",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_ai_cards_llm_catalog_id",
                schema: "soul",
                table: "ai_cards",
                column: "llm_catalog_id");

            migrationBuilder.CreateIndex(
                name: "IX_ai_cards_tts_catalog_id",
                schema: "soul",
                table: "ai_cards",
                column: "tts_catalog_id");

            migrationBuilder.CreateIndex(
                name: "IX_ai_cards_user_id_slug",
                schema: "soul",
                table: "ai_cards",
                columns: new[] { "user_id", "slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_audit_entity",
                schema: "soul",
                table: "audit_log",
                columns: new[] { "entity_type", "entity_id", "created_at" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "idx_audit_user",
                schema: "soul",
                table: "audit_log",
                columns: new[] { "user_id", "created_at" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_llm_catalog_provider_model_id",
                schema: "soul",
                table: "llm_catalog",
                columns: new[] { "provider", "model_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_memory_card",
                schema: "soul",
                table: "memory_metadata",
                column: "ai_card_id");

            migrationBuilder.CreateIndex(
                name: "idx_memory_category",
                schema: "soul",
                table: "memory_metadata",
                columns: new[] { "ai_card_id", "category" });

            migrationBuilder.CreateIndex(
                name: "idx_memory_expiry",
                schema: "soul",
                table: "memory_metadata",
                column: "expires_at",
                filter: "expires_at IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "idx_memory_importance",
                schema: "soul",
                table: "memory_metadata",
                columns: new[] { "ai_card_id", "importance" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_memory_metadata_ai_card_id_qdrant_point_id",
                schema: "soul",
                table: "memory_metadata",
                columns: new[] { "ai_card_id", "qdrant_point_id" },
                unique: true);

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

            migrationBuilder.CreateIndex(
                name: "IX_tts_catalog_provider_voice_id",
                schema: "soul",
                table: "tts_catalog",
                columns: new[] { "provider", "voice_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_usage_daily_card_date",
                schema: "soul",
                table: "usage_daily",
                columns: new[] { "ai_card_id", "usage_date" },
                unique: true,
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "idx_usage_daily_date",
                schema: "soul",
                table: "usage_daily",
                column: "usage_date");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ai_card_channels",
                schema: "soul");

            migrationBuilder.DropTable(
                name: "ai_card_tools",
                schema: "soul");

            migrationBuilder.DropTable(
                name: "audit_log",
                schema: "soul");

            migrationBuilder.DropTable(
                name: "memory_metadata",
                schema: "soul");

            migrationBuilder.DropTable(
                name: "subscriptions",
                schema: "soul");

            migrationBuilder.DropTable(
                name: "usage_daily",
                schema: "soul");

            migrationBuilder.DropTable(
                name: "plans",
                schema: "soul");

            migrationBuilder.DropTable(
                name: "ai_cards",
                schema: "soul");

            migrationBuilder.DropTable(
                name: "llm_catalog",
                schema: "soul");

            migrationBuilder.DropTable(
                name: "tts_catalog",
                schema: "soul");
        }
    }
}
