import type { KcContextLike } from "@keycloakify/keycloak-account-ui/KcAccountUiLoader";

/** Dev-only mock (Keycloak 25+ shape). Real account console injects this at runtime. */
export function getKcAccountContextMock(): KcContextLike.Keycloak25AndUp {
    return {
        serverBaseUrl: "http://localhost:8080",
        authUrl: "http://localhost:8080",
        clientId: "account-console",
        authServerUrl: "http://localhost:8080",
        isOid4VciEnabled: false,
        isViewGroupsEnabled: false,
        realm: {
            name: "chimera",
            registrationEmailAsUsername: false,
            editUsernameAllowed: true,
            isInternationalizationEnabled: true,
            identityFederationEnabled: true,
            userManagedAccessAllowed: false
        },
        resourceUrl: "/mock-account-resources",
        baseUrl: {
            scheme: "http",
            rawSchemeSpecificPart: "//localhost:5173/realms/chimera/account"
        },
        locale: "en",
        isAuthorizationEnabled: false,
        deleteAccountAllowed: false,
        updateEmailFeatureEnabled: true,
        updateEmailActionEnabled: true
    };
}
