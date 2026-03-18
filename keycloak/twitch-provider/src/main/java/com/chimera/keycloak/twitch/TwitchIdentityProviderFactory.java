package com.chimera.keycloak.twitch;

import org.keycloak.broker.provider.AbstractIdentityProviderFactory;
import org.keycloak.models.IdentityProviderModel;
import org.keycloak.models.KeycloakSession;

/**
 * Registers the Twitch Identity Provider with Keycloak's SPI.
 */
public class TwitchIdentityProviderFactory extends AbstractIdentityProviderFactory<TwitchIdentityProvider> {

    public static final String PROVIDER_ID = "twitch";

    @Override
    public String getName() {
        return "Twitch";
    }

    @Override
    public String getId() {
        return PROVIDER_ID;
    }

    @Override
    public TwitchIdentityProvider create(KeycloakSession session, IdentityProviderModel model) {
        return new TwitchIdentityProvider(session, new TwitchIdentityProviderConfig(model));
    }

    @Override
    public TwitchIdentityProviderConfig createConfig() {
        return new TwitchIdentityProviderConfig();
    }
}
