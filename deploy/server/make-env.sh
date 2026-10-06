#!/usr/bin/env bash
# Writes deploy/server/.env with freshly generated secrets.
#   ./make-env.sh 51-250-39-195.sslip.io
# Refuses to overwrite an existing .env: the database and Keycloak volumes keep
# the passwords they were created with, so rotating them here would lock the
# stack out of its own data.
set -euo pipefail
cd "$(dirname "$0")"

APP_HOST="${1:?usage: ./make-env.sh <app-host>}"
[ -e .env ] && { echo ".env already exists, not overwriting" >&2; exit 1; }

secret() { openssl rand -base64 33 | tr -d '/+=' | cut -c1-32; }

# Split cores between the voice path and background models only on 8+ cores
# without hyperthreads (see the kokoro service in compose.yml).
cores=$(nproc 2>/dev/null || echo 1)
tpc=$(lscpu 2>/dev/null | awk -F: '/Thread\(s\) per core/ {gsub(/ /, "", $2); print $2}')
voice_cpus=; background_cpus=
if [ "$cores" -ge 8 ] && [ "${tpc:-2}" = 1 ]; then
  half=$((cores / 2))
  voice_cpus="0-$((half - 1))"; background_cpus="${half}-$((cores - 1))"
fi
pg=$(secret); kcpg=$(secret); kcadmin=$(secret); rabbit=$(secret); minio=$(secret)

umask 077
cat > .env <<EOF
APP_HOST=${APP_HOST}

# CPU split (empty = no pinning)
VOICE_CPUS=${voice_cpus}
BACKGROUND_CPUS=${background_cpus}

# Compose-level secrets (also read by the containers that own them)
POSTGRES_PASSWORD=${pg}
KC_POSTGRES_PASSWORD=${kcpg}
KEYCLOAK_ADMIN_PASSWORD=${kcadmin}
RABBITMQ_PASSWORD=${rabbit}
MINIO_ROOT_PASSWORD=${minio}

# Web (NextAuth). KEYCLOAK_CLIENT_SECRET must match the chimera-web client.
AUTH_SECRET=$(openssl rand -base64 32)
KEYCLOAK_CLIENT_SECRET=$(secret)

# API
PostgresSettings__Database=inktide
PostgresSettings__Username=inktide
PostgresSettings__Password=${pg}
RabbitMQSettings__Username=inktide
RabbitMQSettings__Password=${rabbit}
S3Settings__Enabled=true
S3Settings__AccessKey=minio
S3Settings__SecretKey=${minio}
S3Settings__DefaultBucket=inktide-uploads
DataProtection__MasterKey=$(openssl rand -base64 32)
AuthSettings__SigningSecret=$(openssl rand -base64 32)
SmtpSettings__Host=localhost
SmtpSettings__Port=1025
SmtpSettings__FromAddress=noreply@inktide.app
SmtpSettings__FromName=Inktide
# Keycloak admin client and Discord are disabled on this server, but the startup
# guard in Program.cs rejects their CHANGE_ME defaults regardless.
KeycloakAdminSettings__ClientId=unused
KeycloakAdminSettings__ClientSecret=unused
DiscordSettings__BotToken=unused
DiscordSettings__ClientId=unused
DiscordSettings__ClientSecret=unused
# No payment provider is configured on the demo server; checkout stays inert.
BillingSettings__ActiveProvider=yookassa
StripeSettings__SecretKey=sk_test_unset
StripeSettings__WebhookSecret=whsec_unset

# LLM: no platform provider. Each user picks a provider and enters their own key
# in the UI (Brain / character wizard); cards without one get no reply.

# Character persona used while projects have no system prompt of their own.
Synapse__DefaultSystemPrompt="You are Quackie, an anime AI co-host who streams in a yellow duck hoodie whose hood has a duck face. You are confident, quick-witted and playful, with a friendly smirk; you love your chat and tease them warmly. Speak in first person as Quackie; the people writing to you are your viewers, so never call them Quackie. Start every reply with a short reaction of two to five words (for example: Oh, nice one!), then continue; keep the whole reply to 1-3 short sentences. Your words are spoken aloud by a voice, so never use emoji, markdown, hashtags or stage directions like *quacks* or (laughs). Address viewers by their username when you reply to them directly. React to stream events like raids, subs and follows with genuine hype. Avoid politics, religion and NSFW content."
EOF
echo "wrote $(pwd)/.env for ${APP_HOST}"
