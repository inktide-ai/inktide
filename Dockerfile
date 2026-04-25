FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /repo

COPY Inktide.API.sln .
COPY src/ src/

RUN --mount=type=cache,target=/root/.nuget/packages \
    dotnet restore Inktide.API.sln

RUN --mount=type=cache,target=/root/.nuget/packages \
    dotnet publish src/Inktide.API/Inktide.API.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# ── Rhubarb Lip Sync ──────────────────────────────────────────────────────────
# Provides phoneme-accurate viseme timelines for avatar lip sync.
# Falls back to frontend formant analysis automatically when absent.
ARG RHUBARB_VERSION=1.14.0
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl unzip \
    && curl -fsSL \
       "https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v${RHUBARB_VERSION}/rhubarb-lip-sync-${RHUBARB_VERSION}-linux.zip" \
       -o /tmp/rhubarb.zip \
    && unzip -q /tmp/rhubarb.zip -d /tmp/rhubarb \
    && RHUBARB_DIR=$(find /tmp/rhubarb -maxdepth 2 -name 'rhubarb' -type f -exec dirname {} \; | head -1) \
    && install -m 755 "$RHUBARB_DIR/rhubarb" /usr/local/bin/rhubarb \
    && cp -r "$RHUBARB_DIR/res" /usr/local/bin/res \
    && rm -rf /tmp/rhubarb* \
    && apt-get purge -y curl unzip \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

EXPOSE 5000

ENV ASPNETCORE_URLS=http://+:5000

ENTRYPOINT ["./Inktide.API"]
