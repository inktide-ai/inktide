/**
 * Chimera Register page - 100% visual match from apps/web RegisterPage
 * Adapted for Keycloak: form POST to url.registrationAction, UserProfileFormFields
 */
import { useState, useLayoutEffect, useEffect } from "react";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import type { UserProfileFormFieldsProps } from "keycloakify/login/UserProfileFormFieldsProps";
import type { LazyOrNot } from "keycloakify/tools/LazyOrNot";
import type { ClassKey } from "keycloakify/login";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import styles from "./Register.module.css";

const registerClasses = {
    kcFormGroupClass: styles.field,
    kcLabelClass: styles.label,
    kcInputClass: styles.input,
    kcInputWrapperClass: styles.field,
    kcInputGroup: styles.passwordWrap,
    kcFormPasswordVisibilityButtonClass: styles.passwordToggle,
    /* Our classes for :has() - doUseDefaultCss: false would give undefined otherwise */
    kcFormPasswordVisibilityIconShow: styles.passwordIconHidden,
    kcFormPasswordVisibilityIconHide: styles.passwordIconRevealed,
    kcLabelWrapperClass: styles.field,
    kcInputErrorMessageClass: styles.error,
    kcFormButtonsClass: styles.formActions,
    kcButtonClass: styles.signUpButton,
    kcButtonPrimaryClass: styles.signUpButton,
    kcButtonBlockClass: styles.signUpButton,
    kcButtonLargeClass: styles.signUpButton,
} satisfies Partial<Record<ClassKey, string>>;

const GoogleIcon = () => (
    <svg className={styles.socialIcon} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const TwitchIcon = () => (
    <svg className={styles.socialIcon} width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path fill="#9147FF" d="M4.78 1.333L2.4 3.714v8.572h2.857v2.38l2.381-2.38h1.905L13.829 8V1.333H4.78z" />
        <path fill="#fff" d="M10.971 9.429l1.905-1.905V2.286h-7.62v7.143h1.906v1.904L9.066 9.43h1.905z" />
        <path fill="#9147FF" d="M8.114 4.19h.953v2.858h-.953V4.19zm3.334 0v2.858h-.953V4.19h.953z" />
    </svg>
);

type RegisterProps = PageProps<Extract<KcContext, { pageId: "register.ftl" }>, I18n> & {
    UserProfileFormFields: LazyOrNot<(props: UserProfileFormFieldsProps) => React.ReactElement>;
    doMakeUserConfirmPassword: boolean;
};

export default function Register(props: RegisterProps) {
    const {
        kcContext,
        i18n,
        Template,
        UserProfileFormFields,
        doMakeUserConfirmPassword,
    } = props;
    const { msg } = i18n;
    const {
        url,
        messagesPerField,
        recaptchaRequired,
        recaptchaVisible,
        recaptchaSiteKey,
        recaptchaAction,
        termsAcceptanceRequired,
    } = kcContext;

    const [isFormSubmittable, setIsFormSubmittable] = useState(false);
    const [areTermsAccepted, setAreTermsAccepted] = useState(false);
    const { kcClsx } = getKcClsx({ doUseDefaultCss: false, classes: registerClasses });

    useLayoutEffect(() => {
        (window as unknown as { onSubmitRecaptcha?: () => void }).onSubmitRecaptcha = () => {
            (document.getElementById("kc-register-form") as HTMLFormElement | null)?.requestSubmit();
        };
        return () => {
            delete (window as unknown as { onSubmitRecaptcha?: () => void }).onSubmitRecaptcha;
        };
    }, []);

    /* Placeholders like Login panel - UserProfileFormFields doesn't support them from Keycloak config */
    useEffect(() => {
        const applyPlaceholders = () => {
            const form = document.getElementById("kc-register-form");
            if (!form) return;
            const emailInput = form.querySelector<HTMLInputElement>('input[name="email"]');
            const usernameInput = form.querySelector<HTMLInputElement>('input[name="username"]');
            const passwordInput = form.querySelector<HTMLInputElement>('input[name="password"]');
            if (emailInput) emailInput.placeholder = "example@mail.com";
            if (usernameInput) usernameInput.placeholder = "johndoe";
            if (passwordInput) passwordInput.placeholder = "••••••••";
        };
        applyPlaceholders();
        const timer = setTimeout(applyPlaceholders, 150);
        return () => clearTimeout(timer);
    }, []);

    const formContent = (
        <div className={styles.page}>
            <div className={styles.logo}>
                <a href={url.loginUrl ?? "#"}>
                    <img src={`${url.resourcesPath}/dist/icon.svg`} alt="Chimera" />
                </a>
            </div>

            <div className={styles.panel}>
                <h1 className={styles.title}>Create Chimera account</h1>

                <form
                    id="kc-register-form"
                    action={url.registrationAction}
                    method="post"
                    className={styles.form}
                    onSubmit={(e) => {
                        const form = e.currentTarget;
                        const passwordConfirm = form.querySelector<HTMLInputElement>('[name="password-confirm"]');
                        const password = form.querySelector<HTMLInputElement>('[name="password"]');
                        if (passwordConfirm && password) {
                            passwordConfirm.value = password.value;
                        }
                    }}
                >
                    <UserProfileFormFields
                        kcContext={kcContext}
                        i18n={i18n}
                        kcClsx={kcClsx}
                        onIsFormSubmittableValueChange={setIsFormSubmittable}
                        doMakeUserConfirmPassword={doMakeUserConfirmPassword}
                    />

                    {termsAcceptanceRequired && (
                        <div className={styles.field}>
                            <div
                                className={styles.termsText}
                                dangerouslySetInnerHTML={{ __html: kcSanitize(String(msg("termsText"))) }}
                            />
                            <label className={styles.checkboxWrap}>
                                <input
                                    type="checkbox"
                                    id="termsAccepted"
                                    name="termsAccepted"
                                    checked={areTermsAccepted}
                                    onChange={(e) => setAreTermsAccepted(e.target.checked)}
                                    aria-invalid={messagesPerField.existsError("termsAccepted")}
                                />
                                <span className={styles.checkboxLabel}>{msg("acceptTerms")}</span>
                            </label>
                            {messagesPerField.existsError("termsAccepted") && (
                                <p className={styles.error} dangerouslySetInnerHTML={{ __html: kcSanitize(messagesPerField.get("termsAccepted")) }} />
                            )}
                        </div>
                    )}

                    {recaptchaRequired && (recaptchaVisible || recaptchaAction === undefined) && (
                        <div className={styles.field}>
                            <div className="g-recaptcha" data-size="compact" data-sitekey={recaptchaSiteKey} data-action={recaptchaAction} />
                        </div>
                    )}

                    {messagesPerField.exists("global") && (
                        <p className={styles.error} dangerouslySetInnerHTML={{ __html: kcSanitize(messagesPerField.get("global")) }} />
                    )}

                    <div className={kcClsx("kcFormButtonsClass")}>
                        {recaptchaRequired && !recaptchaVisible && recaptchaAction !== undefined ? (
                            <button
                                type="submit"
                                className={`g-recaptcha ${styles.signUpButton}`}
                                data-sitekey={recaptchaSiteKey}
                                data-callback="onSubmitRecaptcha"
                                data-action={recaptchaAction}
                            >
                                Sign up
                            </button>
                        ) : (
                            <input
                                type="submit"
                                disabled={!isFormSubmittable || (termsAcceptanceRequired && !areTermsAccepted)}
                                className={kcClsx("kcButtonClass", "kcButtonPrimaryClass", "kcButtonBlockClass", "kcButtonLargeClass")}
                                value="Sign up"
                            />
                        )}
                    </div>
                </form>

                <div className={styles.separator}>
                    <span className={styles.separatorLine} />
                    <span className={styles.separatorText}>or</span>
                    <span className={styles.separatorLine} />
                </div>

                <div className={styles.socialButtons}>
                    <a href={url.loginUrl} className={styles.socialButton}>
                        <GoogleIcon />
                        Sign up with Google
                    </a>
                    <a href={url.loginUrl} className={styles.socialButton}>
                        <TwitchIcon />
                        Sign up with Twitch
                    </a>
                </div>

                <div className={styles.loginBlock}>
                    <p className={styles.loginText}>Already have an account?</p>
                    <a href={url.loginUrl} className={styles.loginLink}>
                        Sign in
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
            socialProvidersNode={null}
            bodyClassName={styles.page}
        >
            {formContent}
        </Template>
    );
}
