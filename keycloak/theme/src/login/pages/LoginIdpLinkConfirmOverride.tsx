/**
 * Chimera — override IdP link when email exists (login-idp-link-confirm-override.ftl)
 */
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import styles from "./IdpFlow.module.css";

export default function LoginIdpLinkConfirmOverride(
    props: PageProps<Extract<KcContext, { pageId: "login-idp-link-confirm-override.ftl" }>, I18n>
) {
    const { kcContext, i18n, Template } = props;
    const { url, idpDisplayName } = kcContext;
    const { msg, msgStr } = i18n;

    const content = (
        <div className={styles.page}>
            <div className={styles.logo}>
                <a href={url.loginUrl ?? "#"}>
                    <img src={`${url.resourcesPath}/dist/icon.svg`} alt="Chimera" />
                </a>
            </div>

            <div className={styles.panel}>
                <h1 className={styles.title}>{msgStr("confirmOverrideIdpTitle")}</h1>

                <p className={styles.bodyText}>
                    {msg("pageExpiredMsg1")}{" "}
                    <a id="loginRestartLink" className={styles.link} href={url.loginRestartFlowUrl}>
                        {msg("doClickHere")}
                    </a>
                </p>

                <form id="kc-register-form" action={url.loginAction} method="post" className={`${styles.actions} ${styles.formSpacer}`}>
                    <button
                        type="submit"
                        className={styles.btnPrimary}
                        name="submitAction"
                        id="confirmOverride"
                        value="confirmOverride"
                    >
                        {msgStr("confirmOverrideIdpContinue", idpDisplayName)}
                    </button>
                </form>
            </div>
        </div>
    );

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={false}
            displayMessage={false}
            headerNode={<span />}
            displayInfo={false}
            socialProvidersNode={null}
            bodyClassName={styles.page}
        >
            {content}
        </Template>
    );
}
