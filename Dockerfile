# syntax=docker/dockerfile:1
#
# Builds the API from source. The previous version copied a pre-built
# `publish/` directory, which is gitignored and therefore absent from a clean
# checkout: the image could only be produced on a machine that had already run
# `dotnet publish`, and what it contained depended on whatever was in that
# folder at the time.
#
# linux/amd64 only: Rhubarb ships no arm64 build.

ARG DOTNET_VERSION=10.0
ARG RHUBARB_VERSION=1.14.0

# --- Rhubarb ---------------------------------------------------------------
# Fetched in its own stage so curl, unzip and the apt lists never reach the
# runtime image; only the extracted binary is copied forward.
FROM debian:bookworm-slim AS rhubarb
ARG RHUBARB_VERSION
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends ca-certificates curl unzip; \
    curl -fsSL -o /tmp/rhubarb.zip \
      "https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v${RHUBARB_VERSION}/rhubarb-lip-sync-${RHUBARB_VERSION}-linux.zip"; \
    unzip -q /tmp/rhubarb.zip -d /tmp/rhubarb; \
    dir="$(find /tmp/rhubarb -maxdepth 2 -name rhubarb -type f -exec dirname {} \; | head -1)"; \
    test -n "$dir"; \
    mkdir -p /opt/rhubarb; \
    install -m 0755 "$dir/rhubarb" /opt/rhubarb/rhubarb; \
    cp -r "$dir/res" /opt/rhubarb/res; \
    /opt/rhubarb/rhubarb --version

# --- Build -----------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS build
WORKDIR /src

COPY . .

# The NuGet cache is a BuildKit cache mount rather than an image layer, so
# repeat builds skip the download without leaving packages in the image.
RUN --mount=type=cache,target=/root/.nuget/packages \
    dotnet publish src/Inktide.API/Inktide.API.csproj \
      --configuration Release \
      --output /app/publish \
      -p:UseAppHost=false

# --- Runtime ---------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS runtime
WORKDIR /app

# RhubarbService resolves the executable through $PATH.
COPY --from=rhubarb /opt/rhubarb/rhubarb /usr/local/bin/rhubarb
COPY --from=rhubarb /opt/rhubarb/res /usr/local/bin/res

COPY --from=build /app/publish .

# APP_UID is defined by the base image; running as root is not needed for an
# HTTP listener above port 1024.
USER $APP_UID

# Matches Kestrel__Endpoints__Http__Url in docker-compose.yml. The old image
# defaulted to 5000 while compose ran it on 5001, so the two disagreed unless
# the environment overrode the default.
EXPOSE 5001
ENV ASPNETCORE_URLS=http://+:5001 \
    DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_EnableDiagnostics=0

ENTRYPOINT ["dotnet", "Inktide.API.dll"]
