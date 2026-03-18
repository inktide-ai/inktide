/**
 * Chimera Forgot Password page - from apps/web ForgotPasswordPage
 * Keycloak login-reset-password.ftl: form POST to url.loginAction
 */
import { useState } from "react";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import styles from "./ForgotPassword.module.css";

export default function ForgotPassword(props: PageProps<Extract<KcContext, { pageId: "login-reset-password.ftl" }>, I18n>) {
    const { kcContext, i18n, Template } = props;
    const { url, auth, messagesPerField } = kcContext;
    const { msg } = i18n;

    const [isSubmitting, setIsSubmitting] = useState(false);

    /* Always show Email - realm should have Login with email + Email as username */
    const label = msg("email");

    const hasError = messagesPerField.existsError("username");
    const errorMessage = hasError ? messagesPerField.get("username") : "";

    const formContent = (
        <div className={styles.page}>
            <div className={styles.logo}>
                <a href={url.loginUrl ?? "#"}>
                    <img src={`${url.resourcesPath}/dist/icon.svg`} alt="Chimera" />
                </a>
            </div>

            <div className={styles.panel}>
                <h1 className={styles.title}>Forgot password?</h1>
                <p className={styles.subtitle}>
                    Enter your email and we'll send you a link to reset your password.
                </p>

                <form
                    id="kc-reset-password-form"
                    className={styles.form}
                    action={url.loginAction}
                    method="post"
                    onSubmit={() => {
                        setIsSubmitting(true);
                        return true;
                    }}
                >
                    <div className={styles.field}>
                        <label htmlFor="username" className={styles.label}>
                            {label}
                        </label>
                        <input
                            type="email"
                            id="username"
                            name="username"
                            className={styles.input}
                            placeholder="example@mail.com"
                            autoComplete="email"
                            autoFocus
                            defaultValue={auth.attemptedUsername ?? ""}
                            aria-invalid={hasError}
                            readOnly={isSubmitting}
                        />
                    </div>

                    {hasError && errorMessage && (
                        <p className={styles.error} dangerouslySetInnerHTML={{ __html: kcSanitize(errorMessage) }} />
                    )}

                    <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                        {isSubmitting ? "Sending..." : "Send reset link"}
                    </button>
                </form>

                <div className={styles.backBlock}>
                    <p className={styles.backText}>Remember your password?</p>
                    <a href={url.loginUrl} className={styles.backLink}>
                        Back to login
                    </a>
                </div>
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
