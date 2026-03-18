package com.chimera.keycloak.twitch;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import org.jboss.logging.Logger;
import org.keycloak.broker.oidc.OIDCIdentityProvider;
import org.keycloak.broker.provider.BrokeredIdentityContext;
import org.keycloak.models.KeycloakSession;

import java.util.ArrayList;
import java.util.List;

/**
 * Twitch Identity Provider for Keycloak 25.
 * <p>
 * Twitch returns {@code "scope"} as a JSON array ({@code ["openid","user:read:email"]})
 * instead of the OAuth 2.0 spec-compliant space-delimited string.
 * Keycloak's {@link OIDCIdentityProvider} fails to deserialize this.
 * We intercept the raw token response and normalize {@code scope} before passing it up.
 */
public class TwitchIdentityProvider extends OIDCIdentityProvider {

    private static final Logger LOG = Logger.getLogger(TwitchIdentityProvider.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public TwitchIdentityProvider(KeycloakSession session, TwitchIdentityProviderConfig config) {
        super(session, config);
    }

    @Override
    public BrokeredIdentityContext getFederatedIdentity(String response) {
        return super.getFederatedIdentity(normalizeScopeField(response));
    }

    /**
     * If {@code "scope"} is a JSON array, join its elements into a space-delimited string.
     * Returns the original response unchanged if scope is already a string or absent.
     */
    private static String normalizeScopeField(String response) {
        try {
            JsonNode root = MAPPER.readTree(response);
            JsonNode scopeNode = root.get("scope");

            if (scopeNode == null || !scopeNode.isArray()) {
                return response;
            }

            List<String> scopes = new ArrayList<>();
            for (JsonNode element : scopeNode) {
                scopes.add(element.asText());
            }
            String joined = String.join(" ", scopes);

            ((ObjectNode) root).set("scope", new TextNode(joined));

            LOG.debugf("Normalized Twitch scope array to: \"%s\"", joined);
            return MAPPER.writeValueAsString(root);
        } catch (Exception e) {
            LOG.warnf("Failed to normalize Twitch scope, passing response as-is: %s", e.getMessage());
            return response;
        }
    }
}
