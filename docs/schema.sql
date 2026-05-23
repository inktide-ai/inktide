
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS soul;
CREATE SCHEMA IF NOT EXISTS marketplace;
CREATE SCHEMA IF NOT EXISTS project;
CREATE SCHEMA IF NOT EXISTS billing;
CREATE SCHEMA IF NOT EXISTS organization;
CREATE SCHEMA IF NOT EXISTS graph;


CREATE TABLE soul.llm_catalog (
    id           UUID        NOT NULL,
    provider     TEXT        NOT NULL,
    model_id     TEXT        NOT NULL,
    display_name TEXT        NOT NULL,
    tier         TEXT        NOT NULL DEFAULT 'free',
    is_available BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ,

    CONSTRAINT pk_llm_catalog PRIMARY KEY (id),
    CONSTRAINT uq_llm_catalog_provider_model UNIQUE (provider, model_id)
);

CREATE TABLE soul.tts_catalog (
    id           UUID        NOT NULL,
    provider     TEXT        NOT NULL,
    voice_id     TEXT        NOT NULL,
    display_name TEXT        NOT NULL,
    language     TEXT        NOT NULL DEFAULT 'en',
    gender       TEXT,
    sample_url   TEXT,
    tier         TEXT        NOT NULL DEFAULT 'free',
    is_available BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ,

    CONSTRAINT pk_tts_catalog PRIMARY KEY (id),
    CONSTRAINT uq_tts_catalog_provider_voice UNIQUE (provider, voice_id)
);

-- ASP.NET Core Data Protection key ring
CREATE TABLE "DataProtectionKeys" (
    "Id"           SERIAL  NOT NULL,
    "FriendlyName" TEXT,
    "Xml"          TEXT,

    CONSTRAINT pk_data_protection_keys PRIMARY KEY ("Id")
);

CREATE TABLE soul.user_profiles (
    user_id    VARCHAR(64)   NOT NULL,
    avatar_url VARCHAR(2048),

    CONSTRAINT pk_user_profiles PRIMARY KEY (user_id)
);

CREATE TABLE soul.ai_cards (
    id                 UUID    NOT NULL,
    user_id            UUID    NOT NULL,
    name               TEXT    NOT NULL,
    slug               TEXT    NOT NULL,
    avatar_url         TEXT,
    personality        TEXT    NOT NULL DEFAULT '',
    system_prompt      TEXT    NOT NULL,
    llm_catalog_id     UUID    NOT NULL,
    llm_config         JSONB   NOT NULL,
    tts_catalog_id     UUID,
    tts_config         JSONB,
    appearance         JSONB   NOT NULL,
    response_behavior  JSONB   NOT NULL,
    memory_settings    JSONB   NOT NULL,
    auto_pilot         JSONB   NOT NULL,
    personality_config JSONB   NOT NULL DEFAULT '{}',
    description        TEXT    NOT NULL DEFAULT '',
    status             TEXT    NOT NULL DEFAULT 'active',   -- active | paused | archived
    cover_url          TEXT,
    visibility         TEXT    NOT NULL DEFAULT 'private',  -- public | private
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at         TIMESTAMPTZ,
    created_at         TIMESTAMPTZ,
    updated_at         TIMESTAMPTZ,

    CONSTRAINT pk_ai_cards PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uq_ai_cards_user_slug
    ON soul.ai_cards (user_id, slug);

CREATE INDEX idx_ai_cards_user_id
    ON soul.ai_cards (user_id);

CREATE INDEX idx_ai_cards_user_active
    ON soul.ai_cards (user_id, is_active)
    WHERE is_active = TRUE AND deleted_at IS NULL;

CREATE INDEX idx_ai_cards_deleted_at
    ON soul.ai_cards (deleted_at)
    WHERE deleted_at IS NULL;


CREATE TABLE soul.ai_card_channels (
    id                   UUID        NOT NULL,
    ai_card_id           UUID        NOT NULL,
    platform             TEXT        NOT NULL DEFAULT 'twitch',
    channel_name         TEXT        NOT NULL,
    channel_id           TEXT,
    bot_username         TEXT        NOT NULL,
    oauth_token_enc      TEXT,
    custom_bot_token_enc TEXT,
    refresh_token_enc    TEXT,
    token_expires_at     TIMESTAMPTZ,
    is_active            BOOLEAN     NOT NULL DEFAULT TRUE,
    connected_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ,

    CONSTRAINT pk_ai_card_channels PRIMARY KEY (id)
);

CREATE INDEX idx_ai_card_channels_card
    ON soul.ai_card_channels (ai_card_id);

CREATE UNIQUE INDEX uq_ai_card_channels_card_platform_name
    ON soul.ai_card_channels (ai_card_id, platform, channel_name);

CREATE INDEX idx_ai_card_channels_active
    ON soul.ai_card_channels (platform, is_active)
    WHERE is_active = TRUE;


CREATE TABLE soul.ai_card_tools (
    id          UUID    NOT NULL,
    ai_card_id  UUID    NOT NULL,
    tool_name   TEXT    NOT NULL,
    tool_config JSONB   NOT NULL,
    is_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ,

    CONSTRAINT pk_ai_card_tools PRIMARY KEY (id)
);

CREATE INDEX idx_ai_card_tools_card
    ON soul.ai_card_tools (ai_card_id);

CREATE UNIQUE INDEX uq_ai_card_tools_card_tool_name
    ON soul.ai_card_tools (ai_card_id, tool_name);


CREATE TABLE soul.ai_card_models (
    id                 UUID        NOT NULL,
    user_id            UUID        NOT NULL,
    ai_card_id         UUID        NOT NULL,
    storage_key        TEXT        NOT NULL,
    public_url         TEXT        NOT NULL,
    original_file_name TEXT        NOT NULL,
    content_type       TEXT        NOT NULL,
    size_bytes         BIGINT      NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL,

    CONSTRAINT pk_ai_card_models PRIMARY KEY (id)
);

CREATE UNIQUE INDEX idx_ai_card_models_storage_key
    ON soul.ai_card_models (storage_key);

CREATE INDEX idx_ai_card_models_card
    ON soul.ai_card_models (ai_card_id);

CREATE INDEX idx_ai_card_models_user_card
    ON soul.ai_card_models (user_id, ai_card_id);


CREATE TABLE soul.ai_card_scenes (
    id                 UUID          NOT NULL,
    user_id            UUID          NOT NULL,
    ai_card_id         UUID          NOT NULL,
    storage_key        TEXT          NOT NULL,
    public_url         TEXT          NOT NULL,
    original_file_name TEXT          NOT NULL,
    content_type       TEXT          NOT NULL,
    size_bytes         BIGINT        NOT NULL,
    tag                VARCHAR(128),
    display_name       VARCHAR(200),
    description        VARCHAR(2000),
    created_at         TIMESTAMPTZ   NOT NULL,

    CONSTRAINT pk_ai_card_scenes PRIMARY KEY (id)
);

CREATE UNIQUE INDEX idx_ai_card_scenes_storage_key
    ON soul.ai_card_scenes (storage_key);

CREATE INDEX idx_ai_card_scenes_card
    ON soul.ai_card_scenes (ai_card_id);

CREATE INDEX idx_ai_card_scenes_user_card
    ON soul.ai_card_scenes (user_id, ai_card_id);


CREATE TABLE soul.ai_card_custom_scene_tags (
    id               UUID          NOT NULL,
    user_id          UUID          NOT NULL,
    ai_card_id       UUID          NOT NULL,
    label            VARCHAR(128)  NOT NULL,
    label_normalized VARCHAR(128)  NOT NULL,
    color            VARCHAR(7),
    created_at       TIMESTAMPTZ   NOT NULL,

    CONSTRAINT pk_ai_card_custom_scene_tags PRIMARY KEY (id)
);

CREATE UNIQUE INDEX idx_ai_card_custom_scene_tags_card_label_norm
    ON soul.ai_card_custom_scene_tags (ai_card_id, label_normalized);

CREATE INDEX idx_ai_card_custom_scene_tags_card
    ON soul.ai_card_custom_scene_tags (ai_card_id);


CREATE TABLE soul.ai_card_run_presets (
    id                         UUID          NOT NULL,
    user_id                    UUID          NOT NULL,
    ai_card_id                 UUID          NOT NULL,
    name                       VARCHAR(200)  NOT NULL,
    description                VARCHAR(1000),
    icon                       VARCHAR(64),
    is_active                  BOOLEAN       NOT NULL DEFAULT FALSE,
    override_llm_model_id      VARCHAR(200),
    override_temperature       REAL,
    override_emotion_preset_id VARCHAR(100),
    override_voice_profile_id  VARCHAR(200),
    created_at                 TIMESTAMPTZ,
    updated_at                 TIMESTAMPTZ,

    CONSTRAINT pk_ai_card_run_presets PRIMARY KEY (id)
);

CREATE INDEX idx_ai_card_run_presets_card
    ON soul.ai_card_run_presets (ai_card_id);

CREATE INDEX idx_ai_card_run_presets_user_card
    ON soul.ai_card_run_presets (user_id, ai_card_id);

CREATE UNIQUE INDEX idx_ai_card_run_presets_active
    ON soul.ai_card_run_presets (ai_card_id, is_active)
    WHERE is_active = TRUE;


CREATE TABLE soul.usage_daily (
    id                UUID    NOT NULL,
    ai_card_id        UUID    NOT NULL,
    usage_date        DATE    NOT NULL,
    llm_calls         INTEGER NOT NULL DEFAULT 0,
    tokens_prompt     INTEGER NOT NULL DEFAULT 0,
    tokens_completion INTEGER NOT NULL DEFAULT 0,
    messages_received INTEGER NOT NULL DEFAULT 0,
    messages_sent     INTEGER NOT NULL DEFAULT 0,
    tts_characters    INTEGER NOT NULL DEFAULT 0,
    donkey_thoughts   INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT pk_usage_daily PRIMARY KEY (id),
    CONSTRAINT uq_usage_daily_card_date UNIQUE (ai_card_id, usage_date)
);

CREATE INDEX idx_usage_daily_date
    ON soul.usage_daily (usage_date);

CREATE INDEX idx_usage_daily_card_date
    ON soul.usage_daily (ai_card_id, usage_date DESC);


CREATE TABLE soul.audit_log (
    id          UUID        NOT NULL,
    user_id     UUID        NOT NULL,
    entity_type TEXT        NOT NULL,
    entity_id   UUID        NOT NULL,
    action      TEXT        NOT NULL,
    changes     JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ,

    CONSTRAINT pk_audit_log PRIMARY KEY (id)
);

CREATE INDEX idx_audit_user
    ON soul.audit_log (user_id, created_at DESC);

CREATE INDEX idx_audit_entity
    ON soul.audit_log (entity_type, entity_id, created_at DESC);


CREATE TABLE soul.outbox_events (
    id           UUID         NOT NULL,
    event_type   VARCHAR(100) NOT NULL,
    payload      TEXT         NOT NULL,
    created_at   TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    error        TEXT,

    CONSTRAINT pk_outbox_events PRIMARY KEY (id)
);

CREATE INDEX idx_outbox_unprocessed
    ON soul.outbox_events (processed_at)
    WHERE processed_at IS NULL;


CREATE TABLE soul.user_provider_credentials (
    id          UUID         NOT NULL,
    user_id     UUID         NOT NULL,
    provider_id VARCHAR(64)  NOT NULL,
    api_key_enc TEXT,
    base_url    TEXT,
    config      TEXT,
    verified_at TIMESTAMPTZ,
    last_error  TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ,
    updated_at  TIMESTAMPTZ,

    CONSTRAINT pk_user_provider_credentials PRIMARY KEY (id),
    CONSTRAINT uq_user_provider_credentials_user_provider UNIQUE (user_id, provider_id)
);

CREATE INDEX idx_user_provider_credentials_user
    ON soul.user_provider_credentials (user_id);


CREATE TABLE soul.memory_metadata (
    id               UUID        NOT NULL,
    ai_card_id       UUID        NOT NULL,
    qdrant_point_id  UUID        NOT NULL,
    fact_text        TEXT        NOT NULL,
    category         TEXT        NOT NULL DEFAULT 'general',
    source_type      TEXT        NOT NULL DEFAULT 'chat',
    importance       FLOAT       NOT NULL DEFAULT 0.5,
    remembered_at    TIMESTAMPTZ,
    last_recalled_at TIMESTAMPTZ,
    recall_count     INTEGER     NOT NULL DEFAULT 0,
    expires_at       TIMESTAMPTZ,

    CONSTRAINT pk_memory_metadata PRIMARY KEY (id)
);

CREATE INDEX idx_memory_card
    ON soul.memory_metadata (ai_card_id);

CREATE UNIQUE INDEX uq_memory_card_point
    ON soul.memory_metadata (ai_card_id, qdrant_point_id);

CREATE INDEX idx_memory_importance
    ON soul.memory_metadata (ai_card_id, importance DESC);

CREATE INDEX idx_memory_category
    ON soul.memory_metadata (ai_card_id, category);

CREATE INDEX idx_memory_expiry
    ON soul.memory_metadata (expires_at)
    WHERE expires_at IS NOT NULL;


CREATE TABLE marketplace.connectors (
    id           UUID         NOT NULL,
    slug         VARCHAR(64)  NOT NULL,
    name         VARCHAR(128) NOT NULL,
    description  VARCHAR(512) NOT NULL,
    category     VARCHAR(64)  NOT NULL,
    icon_url     VARCHAR(512) NOT NULL,
    is_available BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order   INTEGER      NOT NULL DEFAULT 0,

    CONSTRAINT pk_connectors PRIMARY KEY (id),
    CONSTRAINT uq_connectors_slug UNIQUE (slug)
);

CREATE TABLE marketplace.connector_installations (
    id           UUID        NOT NULL,
    soul_id      UUID        NOT NULL,
    connector_id UUID        NOT NULL,
    installed_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT pk_connector_installations PRIMARY KEY (id),
    CONSTRAINT uq_connector_installations_soul_connector UNIQUE (soul_id, connector_id)
);

CREATE INDEX idx_connector_installations_soul
    ON marketplace.connector_installations (soul_id);

CREATE INDEX idx_connector_installations_connector
    ON marketplace.connector_installations (connector_id);



CREATE TABLE project.projects (
    id              UUID         NOT NULL,
    user_id         UUID         NOT NULL,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    active_soul_id  UUID,
    active_model_id UUID,
    active_scene_id UUID,
    system_prompt   TEXT,
    status          VARCHAR(50)  NOT NULL,
    created_at      TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ,

    CONSTRAINT pk_projects PRIMARY KEY (id)
);

CREATE INDEX idx_projects_user_id
    ON project.projects (user_id);

CREATE INDEX idx_projects_active_soul_id
    ON project.projects (active_soul_id);



CREATE TABLE billing.user_subscriptions (
    id                   UUID         NOT NULL,
    user_id              VARCHAR(64)  NOT NULL,
    plan                 VARCHAR(16)  NOT NULL,   -- Free | Pro | Enterprise
    status               VARCHAR(16)  NOT NULL,   -- Active | Trialing | PastDue | Canceled
    provider             VARCHAR(32)  NOT NULL,
    provider_sub_id      VARCHAR(128),
    provider_customer_id VARCHAR(128),
    current_period_end   TIMESTAMPTZ,
    created_at           TIMESTAMPTZ  NOT NULL,
    updated_at           TIMESTAMPTZ  NOT NULL,

    CONSTRAINT pk_user_subscriptions PRIMARY KEY (id),
    CONSTRAINT uq_user_subscriptions_user_id UNIQUE (user_id)
);

CREATE INDEX idx_billing_sub_provider_sub_id
    ON billing.user_subscriptions (provider_sub_id);



CREATE TABLE organization.organizations (
    id         UUID         NOT NULL,
    name       VARCHAR(256) NOT NULL,
    owner_id   VARCHAR(64)  NOT NULL,
    created_at TIMESTAMPTZ,

    CONSTRAINT pk_organizations PRIMARY KEY (id),
    CONSTRAINT uq_organizations_owner_id UNIQUE (owner_id)
);

CREATE TABLE organization.organization_members (
    id              UUID        NOT NULL,
    organization_id UUID        NOT NULL,
    user_id         VARCHAR(64) NOT NULL,
    role            VARCHAR(16) NOT NULL,   -- Owner | Admin | Member
    joined_at       TIMESTAMPTZ,

    CONSTRAINT pk_organization_members PRIMARY KEY (id),
    CONSTRAINT uq_organization_members_org_user UNIQUE (organization_id, user_id)
);

CREATE TABLE organization.organization_invites (
    id              UUID         NOT NULL,
    organization_id UUID         NOT NULL,
    email           VARCHAR(256) NOT NULL,
    role            VARCHAR(16)  NOT NULL,   -- Owner | Admin | Member
    token           VARCHAR(128) NOT NULL,
    invited_by      VARCHAR(64)  NOT NULL,
    status          VARCHAR(16)  NOT NULL,   -- Pending | Accepted | Expired
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ,

    CONSTRAINT pk_organization_invites PRIMARY KEY (id),
    CONSTRAINT uq_organization_invites_token UNIQUE (token)
);

CREATE INDEX idx_org_invite_org_email_status
    ON organization.organization_invites (organization_id, email, status);


CREATE TABLE graph.graph_definitions (
    id         UUID        NOT NULL,
    project_id UUID        NOT NULL,
    user_id    UUID        NOT NULL,
    nodes      JSONB       NOT NULL,
    edges      JSONB       NOT NULL,
    updated_at TIMESTAMPTZ,

    CONSTRAINT pk_graph_definitions PRIMARY KEY (id),
    CONSTRAINT uq_graph_definitions_project_id UNIQUE (project_id)
);


-- soul
ALTER TABLE soul.ai_cards
    ADD CONSTRAINT fk_ai_cards_llm_catalog
        FOREIGN KEY (llm_catalog_id) REFERENCES soul.llm_catalog (id),
    ADD CONSTRAINT fk_ai_cards_tts_catalog
        FOREIGN KEY (tts_catalog_id) REFERENCES soul.tts_catalog (id);

ALTER TABLE soul.ai_card_channels
    ADD CONSTRAINT fk_ai_card_channels_card
        FOREIGN KEY (ai_card_id) REFERENCES soul.ai_cards (id) ON DELETE CASCADE;

ALTER TABLE soul.ai_card_tools
    ADD CONSTRAINT fk_ai_card_tools_card
        FOREIGN KEY (ai_card_id) REFERENCES soul.ai_cards (id) ON DELETE CASCADE;

ALTER TABLE soul.ai_card_models
    ADD CONSTRAINT fk_ai_card_models_card
        FOREIGN KEY (ai_card_id) REFERENCES soul.ai_cards (id) ON DELETE CASCADE;

ALTER TABLE soul.ai_card_scenes
    ADD CONSTRAINT fk_ai_card_scenes_card
        FOREIGN KEY (ai_card_id) REFERENCES soul.ai_cards (id) ON DELETE CASCADE;

ALTER TABLE soul.ai_card_custom_scene_tags
    ADD CONSTRAINT fk_ai_card_custom_scene_tags_card
        FOREIGN KEY (ai_card_id) REFERENCES soul.ai_cards (id) ON DELETE CASCADE;

ALTER TABLE soul.ai_card_run_presets
    ADD CONSTRAINT fk_ai_card_run_presets_card
        FOREIGN KEY (ai_card_id) REFERENCES soul.ai_cards (id) ON DELETE CASCADE;

ALTER TABLE soul.usage_daily
    ADD CONSTRAINT fk_usage_daily_card
        FOREIGN KEY (ai_card_id) REFERENCES soul.ai_cards (id) ON DELETE CASCADE;

ALTER TABLE soul.memory_metadata
    ADD CONSTRAINT fk_memory_metadata_card
        FOREIGN KEY (ai_card_id) REFERENCES soul.ai_cards (id) ON DELETE CASCADE;

-- marketplace
-- soul_id intentionally has no FK: connector_installations references soul.ai_cards
-- across schema boundaries; referential integrity is enforced at the application layer.
ALTER TABLE marketplace.connector_installations
    ADD CONSTRAINT fk_connector_installations_connector
        FOREIGN KEY (connector_id) REFERENCES marketplace.connectors (id) ON DELETE CASCADE;

-- organization
ALTER TABLE organization.organization_members
    ADD CONSTRAINT fk_organization_members_org
        FOREIGN KEY (organization_id) REFERENCES organization.organizations (id) ON DELETE CASCADE;

ALTER TABLE organization.organization_invites
    ADD CONSTRAINT fk_organization_invites_org
        FOREIGN KEY (organization_id) REFERENCES organization.organizations (id) ON DELETE CASCADE;
