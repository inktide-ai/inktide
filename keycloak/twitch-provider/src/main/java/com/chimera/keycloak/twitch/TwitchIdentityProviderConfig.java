package com.chimera.keycloak.twitch;

import org.keycloak.broker.oidc.OIDCIdentityProviderConfig;
import org.keycloak.models.IdentityProviderModel;

/**
 * Twitch OIDC configuration with pre-filled endpoints.
 * <p>
 * Endpoints sourced from <a href="https://id.twitch.tv/oauth2/.well-known/openid-configuration">Twitch OIDC discovery</a>.
 */
public class TwitchIdentityProviderConfig extends OIDCIdentityProviderConfig {

    private static final String ISSUER          = "https://id.twitch.tv/oauth2";
    private static final String AUTH_URL        = "https://id.twitch.tv/oauth2/authorize";
    private static final String TOKEN_URL       = "https://id.twitch.tv/oauth2/token";
    private static final String USERINFO_URL    = "https://id.twitch.tv/oauth2/userinfo";
    private static final String JWKS_URL_VALUE  = "https://id.twitch.tv/oauth2/keys";
    private static final String SCOPE           = "openid user:read:email";

    public TwitchIdentityProviderConfig(IdentityProviderModel model) {
        super(model);
        applyDefaultsIfMissing();
    }

    public TwitchIdentityProviderConfig() {
        super();
        applyDefaultsIfMissing();
    }

    private void applyDefaultsIfMissing() {
        if (getAuthorizationUrl() == null) setAuthorizationUrl(AUTH_URL);
        if (getTokenUrl() == null)         setTokenUrl(TOKEN_URL);
        if (getUserInfoUrl() == null)      setUserInfoUrl(USERINFO_URL);
        if (getJwksUrl() == null)          setJwksUrl(JWKS_URL_VALUE);
        if (getIssuer() == null)           setIssuer(ISSUER);
        if (getDefaultScope() == null)     setDefaultScope(SCOPE);
        setValidateSignature(true);
        setUseJwksUrl(true);
    }
}
