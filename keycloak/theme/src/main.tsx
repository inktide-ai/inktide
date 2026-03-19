import "./index.css";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { KcPage } from "./kc.gen";
import { getKcContextMock } from "./login/KcPageStory";
import { getKcAccountContextMock } from "./account/getKcAccountContextMock";

// Dev mocks: `?account=1` loads Account console; otherwise login (Chimera theme).
if (import.meta.env.DEV) {
    const accountDev = new URLSearchParams(window.location.search).get("account") === "1";
    window.kcContext = accountDev ? getKcAccountContextMock() : getKcContextMock({
        pageId: "login.ftl",
        overrides: {
            social: {
                displayInfo: true,
                providers: [
                    {
                        alias: "google",
                        providerId: "google",
                        displayName: "Sign in with Google",
                        loginUrl: "#",
                        iconClasses: ""
                    },
                    {
                        alias: "twitch",
                        providerId: "twitch",
                        displayName: "Sign in with Twitch",
                        loginUrl: "#",
                        iconClasses: ""
                    }
                ]
            }
        }
    });
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        {!window.kcContext ? (
            <h1>No Keycloak Context</h1>
        ) : (
            <KcPage kcContext={window.kcContext} />
        )}
    </StrictMode>
);
