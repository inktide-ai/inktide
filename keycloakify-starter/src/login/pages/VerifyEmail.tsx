/**
 * Chimera Verify Email page - modal layout (like Cursor payment modal)
 * Keycloak login-verify-email.ftl: "Check your email" after forgot password
 */
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import styles from "./VerifyEmail.module.css";

export default function VerifyEmail(props: PageProps<Extract<KcContext, { pageId: "login-verify-email.ftl" }>, I18n>) {
    const { kcContext, i18n, Template } = props;
    const { url, user } = kcContext;

    const email = user?.email ?? "";

    const formContent = (
        <div className={styles.page}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <img src={`${url.resourcesPath}/dist/icon.svg`} alt="Chimera" className={styles.logo} />
                    <span className={styles.brand}>Chimera</span>
                </div>

                <h1 className={styles.title}>Check your email</h1>
                <p className={styles.body}>
                    We've sent a link to reset your password to <strong>{email || "your email"}</strong>.
                    <br />
                    Check your inbox and click the link to continue.
                </p>

                <a href={url.loginUrl ?? "#"} className={styles.button}>
                    Back to login
                </a>

                <p className={styles.footer}>
                    Questions? Contact us at{" "}
                    <a href="mailto:hi@chimera.com">hi@chimera.com</a>
                </p>
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
            bodyClassName={styles.page}
        >
            {formContent}
        </Template>
    );
}
