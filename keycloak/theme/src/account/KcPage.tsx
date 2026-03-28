import { lazy } from "react";
import { KcAccountUiLoader } from "@keycloakify/keycloak-account-ui";
import type { KcContextLike } from "@keycloakify/keycloak-account-ui/KcAccountUiLoader";
import { chimeraAccountContent } from "./chimeraAccountContent";
import logoUrl from "../email/resources/img/icon.svg";
import "./account-chimera.css";

const KcAccountUi = lazy(() => import("@keycloakify/keycloak-account-ui/KcAccountUi"));

function AccountLoading() {
    return (
        <div className="chimera-account-loading">
            <div className="chimera-account-loading__spinner" aria-hidden />
            <span>Loading…</span>
        </div>
    );
}

export default function KcPage(props: { kcContext: KcContextLike }) {
    return (
        <div className="chimera-account-root">
            <KcAccountUiLoader
                kcContext={props.kcContext}
                KcAccountUi={KcAccountUi}
                content={chimeraAccountContent}
                logoUrl={logoUrl}
                loadingFallback={<AccountLoading />}
            />
        </div>
    );
}
