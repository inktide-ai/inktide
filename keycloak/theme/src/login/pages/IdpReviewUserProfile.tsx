/**
 * Chimera — review profile before linking IdP (idp-review-user-profile.ftl)
 */
import { useState, type ReactElement } from "react";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { UserProfileFormFieldsProps } from "keycloakify/login/UserProfileFormFieldsProps";
import type { LazyOrNot } from "keycloakify/tools/LazyOrNot";
import type { ClassKey } from "keycloakify/login";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import registerStyles from "./Register.module.css";
import shellStyles from "./IdpFlow.module.css";

const profileClasses = {
    kcFormGroupClass: registerStyles.field,
    kcLabelClass: registerStyles.label,
    kcInputClass: registerStyles.input,
    kcInputWrapperClass: registerStyles.field,
    kcInputGroup: registerStyles.passwordWrap,
    kcFormPasswordVisibilityButtonClass: registerStyles.passwordToggle,
    kcFormPasswordVisibilityIconShow: registerStyles.passwordIconHidden,
    kcFormPasswordVisibilityIconHide: registerStyles.passwordIconRevealed,
    kcLabelWrapperClass: registerStyles.field,
    kcInputErrorMessageClass: registerStyles.error,
    kcFormButtonsClass: registerStyles.formActions,
    kcButtonClass: registerStyles.signUpButton,
    kcButtonPrimaryClass: registerStyles.signUpButton,
    kcButtonBlockClass: registerStyles.signUpButton,
    kcButtonLargeClass: registerStyles.signUpButton,
} satisfies Partial<Record<ClassKey, string>>;

type Props = PageProps<Extract<KcContext, { pageId: "idp-review-user-profile.ftl" }>, I18n> & {
    UserProfileFormFields: LazyOrNot<(props: UserProfileFormFieldsProps) => ReactElement>;
    doMakeUserConfirmPassword: boolean;
};

export default function IdpReviewUserProfile(props: Props) {
    const { kcContext, i18n, Template, UserProfileFormFields, doMakeUserConfirmPassword } = props;
    const { url, messagesPerField } = kcContext;
    const { msgStr } = i18n;

    const [isFormSubmittable, setIsFormSubmittable] = useState(false);
    const { kcClsx } = getKcClsx({ doUseDefaultCss: false, classes: profileClasses });

    const content = (
        <div className={shellStyles.page}>
            <div className={shellStyles.logo}>
                <a href={url.loginUrl ?? "#"}>
                    <img src={`${url.resourcesPath}/dist/icon.svg`} alt="Chimera" />
                </a>
            </div>

            <div className={shellStyles.panel}>
                <h1 className={shellStyles.title}>{msgStr("loginIdpReviewProfileTitle")}</h1>

                <form
                    id="kc-idp-review-profile-form"
                    className={registerStyles.form}
                    action={url.loginAction}
                    method="post"
                >
                    <UserProfileFormFields
                        kcContext={kcContext}
                        i18n={i18n}
                        onIsFormSubmittableValueChange={setIsFormSubmittable}
                        kcClsx={kcClsx}
                        doMakeUserConfirmPassword={doMakeUserConfirmPassword}
                    />

                    {messagesPerField.exists("global") && (
                        <p
                            className={registerStyles.error}
                            dangerouslySetInnerHTML={{ __html: kcSanitize(messagesPerField.get("global")) }}
                        />
                    )}

                    <div className={kcClsx("kcFormButtonsClass")}>
                        <input
                            className={kcClsx("kcButtonClass", "kcButtonPrimaryClass", "kcButtonBlockClass", "kcButtonLargeClass")}
                            type="submit"
                            value={msgStr("doSubmit")}
                            disabled={!isFormSubmittable}
                        />
                    </div>
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
            displayRequiredFields={false}
            headerNode={<span />}
            displayInfo={false}
            socialProvidersNode={null}
            bodyClassName={shellStyles.page}
        >
            {content}
        </Template>
    );
}
