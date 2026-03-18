# Build Keycloak with Twitch provider
# Usage: docker build -t keycloak-twitch .
# Then use this image in docker-compose instead of quay.io/keycloak/keycloak:25.0.6

FROM quay.io/keycloak/keycloak:25.0.6 AS builder

# Copy our provider JAR
COPY target/keycloak-twitch-provider-1.0.0.jar /opt/keycloak/providers/

# Build Keycloak with the provider included
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:25.0.6

# Copy the built Keycloak from builder (includes our provider)
COPY --from=builder /opt/keycloak/ /opt/keycloak/

# Default command
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
