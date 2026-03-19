import type { MenuItem } from "@keycloakify/keycloak-account-ui/root/PageNav";

/** Sidebar: only profile + security (no Applications, Groups, Resources, OID4VCI). */
export const chimeraAccountContent: MenuItem[] = [
    { label: "personalInfo", path: "" },
    {
        label: "accountSecurity",
        children: [
            { label: "signingIn", path: "account-security/signing-in" },
            { label: "deviceActivity", path: "account-security/device-activity" },
            {
                label: "linkedAccounts",
                path: "account-security/linked-accounts",
                isVisible: "isLinkedAccountsEnabled"
            }
        ]
    }
];
