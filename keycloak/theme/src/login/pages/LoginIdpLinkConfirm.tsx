/**
 * Chimera — first-broker login: link IdP to existing account (login-idp-link-confirm.ftl)
 */
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import styles from "./IdpFlow.module.css";

function MessageBanner(props: {
    message: NonNullable<KcContext["message"]>;
}) {
    const { message } = props;
    const inner = <span dangerouslySetInnerHTML={{ __html: kcSanitize(message.summary) }} />;

    if (message.type === "error") {
        return (
            <div className={styles.alertError} role="alert">
                <span className={styles.alertErrorIcon} aria-hidden>
                    !
                </span>
                <div className={styles.alertContent}>{inner}</div>
            </div>
        );
    }
    if (message.type === "warning") {
        return (
            <div className={styles.alertWarning} role="status">
                <span className={styles.alertWarningIcon} aria-hidden>
                    !
                </span>
                <div className={styles.alertContent}>{inner}</div>
            </div>
        );
    }
    return (
        <div className={styles.alertInfo} role="status">
            <span className={styles.alertInfoIcon} aria-hidden>
                i
            </span>
            <div className={styles.alertContent}>{inner}</div>
        </div>
    );
}

export default function LoginIdpLinkConfirm(
    props: PageProps<Extract<KcContext, { pageId: "login-idp-link-confirm.ftl" }>, I18n>
) {
    const { kcContext, i18n, Template } = props;
    const { url, idpAlias, message } = kcContext;
    const { msgStr } = i18n;

    const content = (
        <div className={styles.page}>
            <div className={styles.logo}>
                <a href={url.loginUrl ?? "#"}>
                    <img src={`${url.resourcesPath}/dist/icon.svg`} alt="Chimera" />
                </a>
            </div>

            <div className={styles.panel}>
                <h1 className={styles.title}>{msgStr("confirmLinkIdpTitle")}</h1>

                {message !== undefined && <MessageBanner message={message} />}

                <form id="kc-register-form" action={url.loginAction} method="post" className={styles.actions}>
                    <button
                        type="submit"
                        className={styles.btnSecondary}
                        name="submitAction"
                        id="updateProfile"
                        value="updateProfile"
                    >
                        {msgStr("confirmLinkIdpReviewProfile")}
                    </button>
                    <button
                        type="submit"
                        className={styles.btnPrimary}
                        name="submitAction"
                        id="linkAccount"
                        value="linkAccount"
                    >
                        {msgStr("confirmLinkIdpContinue", idpAlias)}
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
