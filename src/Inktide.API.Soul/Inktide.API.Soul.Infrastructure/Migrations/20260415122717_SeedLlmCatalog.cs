using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inktide.API.Soul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedLlmCatalog : Migration
    {
        private static readonly DateTime _now = new DateTime(2026, 4, 15, 0, 0, 0, DateTimeKind.Utc);

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ON CONFLICT DO NOTHING makes this idempotent: safe to re-run on an already-seeded DB.
            migrationBuilder.Sql($"""
                INSERT INTO soul.llm_catalog (id, provider, model_id, display_name, tier, is_available, created_at) VALUES
                  ('11111111-0001-0000-0000-000000000001', 'openai',     'gpt-4o',                                 'GPT-4o',                     'pro',  true, '{_now:O}'),
                  ('11111111-0001-0000-0000-000000000002', 'openai',     'gpt-4o-mini',                            'GPT-4o Mini',                'free', true, '{_now:O}'),
                  ('11111111-0001-0000-0000-000000000003', 'openai',     'gpt-4-turbo',                            'GPT-4 Turbo',                'pro',  true, '{_now:O}'),
                  ('11111111-0002-0000-0000-000000000001', 'anthropic',  'claude-opus-4-6',                        'Claude Opus 4',              'pro',  true, '{_now:O}'),
                  ('11111111-0002-0000-0000-000000000002', 'anthropic',  'claude-sonnet-4-6',                      'Claude Sonnet 4',            'pro',  true, '{_now:O}'),
                  ('11111111-0002-0000-0000-000000000003', 'anthropic',  'claude-haiku-4-5',                       'Claude Haiku 4',             'free', true, '{_now:O}'),
                  ('11111111-0003-0000-0000-000000000001', 'deepseek',   'deepseek-chat',                          'DeepSeek Chat',              'free', true, '{_now:O}'),
                  ('11111111-0003-0000-0000-000000000002', 'deepseek',   'deepseek-reasoner',                      'DeepSeek R1',                'free', true, '{_now:O}'),
                  ('11111111-0004-0000-0000-000000000001', 'groq',       'llama-3.3-70b-versatile',                'Llama 3.3 70B (Groq)',       'free', true, '{_now:O}'),
                  ('11111111-0004-0000-0000-000000000002', 'groq',       'llama-3.1-8b-instant',                   'Llama 3.1 8B (Groq)',        'free', true, '{_now:O}'),
                  ('11111111-0004-0000-0000-000000000003', 'groq',       'mixtral-8x7b-32768',                     'Mixtral 8x7B (Groq)',        'free', true, '{_now:O}'),
                  ('11111111-0005-0000-0000-000000000001', 'gemini',     'gemini-2.0-flash',                       'Gemini 2.0 Flash',           'free', true, '{_now:O}'),
                  ('11111111-0005-0000-0000-000000000002', 'gemini',     'gemini-1.5-pro',                         'Gemini 1.5 Pro',             'pro',  true, '{_now:O}'),
                  ('11111111-0006-0000-0000-000000000001', 'openrouter', 'meta-llama/llama-3.1-8b-instruct:free',  'Llama 3.1 8B (OpenRouter)',  'free', true, '{_now:O}'),
                  ('11111111-0007-0000-0000-000000000001', 'ollama',     'llama3.1:8b',                            'Llama 3.1 8B (Local)',       'free', true, '{_now:O}'),
                  ('11111111-0007-0000-0000-000000000002', 'ollama',     'qwen2.5:7b',                             'Qwen 2.5 7B (Local)',        'free', true, '{_now:O}'),
                  ('11111111-0007-0000-0000-000000000003', 'ollama',     'mistral:7b',                             'Mistral 7B (Local)',         'free', true, '{_now:O}')
                ON CONFLICT DO NOTHING;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "DELETE FROM soul.llm_catalog WHERE id::text LIKE '11111111-%'");
        }
    }
}
