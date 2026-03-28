/**
 * Chimera Login page - 100% visual match from apps/web
 * Adapted for Keycloak: form POST to url.loginAction, OAuth links from social.providers
 */
import { useState } from "react";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import styles from "./Login.module.css";

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

function isGoogleProvider(alias: string, displayName: string): boolean {
    const a = alias.toLowerCase();
    const d = (displayName ?? "").toLowerCase();
    return a.includes("google") || d.includes("google");
}

function isTwitchProvider(alias: string, displayName: string): boolean {
    const a = alias.toLowerCase();
    const d = (displayName ?? "").toLowerCase();
    return a.includes("twitch") || d.includes("twitch");
}

function getSocialIcon(alias: string, displayName: string) {
    if (isGoogleProvider(alias, displayName)) return <GoogleIcon />;
    if (isTwitchProvider(alias, displayName)) return <TwitchIcon />;
    return null;
}

function getSocialButtonText(alias: string, displayName: string): string {
    if (isGoogleProvider(alias, displayName)) return "Sign in with Google";
    if (isTwitchProvider(alias, displayName)) return "Sign in with Twitch";
    return displayName ?? alias;
}

export default function Login(props: PageProps<Extract<KcContext, { pageId: "login.ftl" }>, I18n>) {
    const { kcContext, i18n, Template } = props;
    const { social, realm, url, usernameHidden, login, auth, registrationDisabled, messagesPerField } = kcContext;
    const { msgStr } = i18n;

    const [isLoginButtonDisabled, setIsLoginButtonDisabled] = useState(false);
    const hasError = messagesPerField.existsError("username", "password");
    const errorMessage = hasError ? messagesPerField.getFirstError("username", "password") : "";

    const usernameLabel = !realm.loginWithEmailAllowed
        ? msgStr("username")
        : !realm.registrationEmailAsUsername
          ? msgStr("usernameOrEmail")
          : msgStr("email");

    const formContent = (
        <div className={styles.page}>
            <div className={styles.logo}>
                <a href={url.loginUrl ?? "#"}>
                    <img src={`${url.resourcesPath}/dist/icon.svg`} alt="Chimera" />
                </a>
            </div>

            <div className={styles.panel}>
                <h1 className={styles.title}>Sign in to Chimera</h1>

                {realm.password && (
                    <form
                        onSubmit={() => {
                            setIsLoginButtonDisabled(true);
                            return true;
                        }}
                        action={url.loginAction}
                        method="post"
                        className={styles.form}
                    >
                        {!usernameHidden && (
                            <div className={styles.field}>
                                <label htmlFor="username" className={styles.label}>
                                    {usernameLabel}
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    defaultValue={login.username ?? ""}
                                    className={styles.input}
                                    placeholder="example@mail.com"
                                    autoComplete="username"
                                    autoFocus
                                    required
                                    aria-invalid={hasError}
                                />
                            </div>
                        )}

                        <div className={styles.field}>
                            <label htmlFor="password" className={styles.label}>
                                Password
                            </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    className={styles.input}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                    aria-invalid={hasError}
                                />
                        </div>

                        <div className={styles.row}>
                            {realm.rememberMe && !usernameHidden && (
                                <label className={styles.checkboxWrap}>
                                    <input
                                        id="rememberMe"
                                        name="rememberMe"
                                        type="checkbox"
                                        defaultChecked={!!login.rememberMe}
                                        className={styles.checkbox}
                                    />
                                    <span className={styles.checkboxLabel}>Remember me</span>
                                </label>
                            )}
                            {realm.resetPasswordAllowed && (
                                <a href={url.loginResetCredentialsUrl} className={styles.forgotLink}>
                                    Forgot password?
                                </a>
                            )}
                        </div>

                        {hasError && errorMessage && (
                            <p className={styles.error} dangerouslySetInnerHTML={{ __html: kcSanitize(errorMessage) }} />
                        )}

                        <input type="hidden" id="id-hidden-input" name="credentialId" value={auth.selectedCredential ?? ""} />
                        <button
                            type="submit"
                            name="login"
                            id="kc-login"
                            className={styles.signInButton}
                            disabled={isLoginButtonDisabled}
                        >
                            {msgStr("doLogIn")}
                        </button>
                    </form>
                )}

                {realm.password &&
                    social?.providers !== undefined &&
                    social.providers.length > 0 && (
                        <>
                            <div className={styles.separator}>
                                <span className={styles.separatorLine} />
                                <span className={styles.separatorText}>or</span>
                                <span className={styles.separatorLine} />
                            </div>

                            <div className={styles.socialButtons}>
                                {social.providers.map((item) => {
                                    const p = Array.isArray(item) ? item[0] : item;
                                    return (
                                        <a
                                            key={p.alias}
                                            id={`social-${p.alias}`}
                                            href={p.loginUrl}
                                            className={styles.socialButton}
                                            type="button"
                                        >
                                            {getSocialIcon(p.alias, p.displayName)}
                                            <span>{getSocialButtonText(p.alias, p.displayName)}</span>
                                        </a>
                                    );
                                })}
                            </div>
                        </>
                    )}

                {realm.password && realm.registrationAllowed && !registrationDisabled && (
                    <div className={styles.registerBlock}>
                        <p className={styles.registerText}>Don't have an account?</p>
                        <a href={url.registrationUrl} className={styles.registerLink}>
                            Sign up
                        </a>
                    </div>
                )}
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
