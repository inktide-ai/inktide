/**
 * Chimera Update Password page - after password reset link
 * Keycloak login-update-password.ftl: form with password-new, password-confirm
 */
import { useState } from "react";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import styles from "./UpdatePassword.module.css";

export default function UpdatePassword(props: PageProps<Extract<KcContext, { pageId: "login-update-password.ftl" }>, I18n>) {
    const { kcContext, i18n, Template } = props;
    const { url, messagesPerField } = kcContext;
    const isAppInitiatedAction = "isAppInitiatedAction" in kcContext && kcContext.isAppInitiatedAction;
    const { msg } = i18n;

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const hasPasswordError = messagesPerField.existsError("password");
    const hasConfirmError = messagesPerField.existsError("password-confirm");
    const passwordError = hasPasswordError ? messagesPerField.get("password") : "";
    const confirmError = hasConfirmError ? messagesPerField.get("password-confirm") : "";

    const formContent = (
        <div className={styles.page}>
            <div className={styles.logo}>
                <a href={url.loginUrl ?? "#"}>
                    <img src={`${url.resourcesPath}/dist/icon.svg`} alt="Chimera" />
                </a>
            </div>

            <div className={styles.panel}>
                <h1 className={styles.title}>{msg("updatePasswordTitle")}</h1>
                <p className={styles.subtitle}>
                    Create a new password for your Chimera account.
                </p>

                <form
                    id="kc-update-password-form"
                    className={styles.form}
                    action={url.loginAction}
                    method="post"
                    onSubmit={() => {
                        setIsSubmitting(true);
                        return true;
                    }}
                >
                    <div className={styles.field}>
                        <label htmlFor="password-new" className={styles.label}>
                            {msg("passwordNew")}
                        </label>
                        <div className={styles.passwordWrap}>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password-new"
                                name="password-new"
                                className={styles.input}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                autoFocus
                                required
                                aria-invalid={hasPasswordError}
                                readOnly={isSubmitting}
                            />
                            <button
                                type="button"
                                className={styles.passwordToggle}
                                onClick={() => setShowPassword((v) => !v)}
                                tabIndex={-1}
                                aria-label={showPassword ? "Hide" : "Show"}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {hasPasswordError && passwordError && (
                        <p className={styles.error} dangerouslySetInnerHTML={{ __html: kcSanitize(passwordError) }} />
                    )}

                    <div className={styles.field}>
                        <label htmlFor="password-confirm" className={styles.label}>
                            {msg("passwordConfirm")}
                        </label>
                        <div className={styles.passwordWrap}>
                            <input
                                type={showConfirm ? "text" : "password"}
                                id="password-confirm"
                                name="password-confirm"
                                className={styles.input}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                required
                                aria-invalid={hasConfirmError}
                                readOnly={isSubmitting}
                            />
                            <button
                                type="button"
                                className={styles.passwordToggle}
                                onClick={() => setShowConfirm((v) => !v)}
                                tabIndex={-1}
                                aria-label={showConfirm ? "Hide" : "Show"}
                            >
                                {showConfirm ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {hasConfirmError && confirmError && (
                        <p className={styles.error} dangerouslySetInnerHTML={{ __html: kcSanitize(confirmError) }} />
                    )}

                    <div className={styles.field}>
                        <label className={styles.checkboxWrap}>
                            <input
                                type="checkbox"
                                id="logout-sessions"
                                name="logout-sessions"
                                className={styles.checkbox}
                            />
                            <span className={styles.checkboxLabel}>{msg("logoutOtherSessions")}</span>
                        </label>
                    </div>

                    <div className={styles.actions}>
                        {isAppInitiatedAction && (
                            <a href={url.loginAction} className={styles.cancelButton}>
                                {msg("doCancel")}
                            </a>
                        )}
                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "..." : msg("doSubmit")}
                        </button>
                    </div>
                </form>

                <div className={styles.backBlock}>
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
