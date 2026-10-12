<#import "template.ftl" as layout>
<#import "quackie.ftl" as qk>
<#-- Sign-up: a blank tape. The nickname is written on its label as you type; recording slides it into the deck. -->
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('email','username','nickname','password','password-confirm'); section>
  <#if section = "chip">
    ${msg("qk.register.chip")}
  <#elseif section = "header">
    ${msg("qk.register.title")}
  <#elseif section = "stage">
    <@qk.tape label=(profile.attributesByName.nickname.value)!'' placeholder=msg("qk.label.blank") mode="rec" />
  <#elseif section = "form">
    <p class="qk-lead">${msg("qk.register.lead")}</p>

    <form class="qk-form" action="${url.registrationAction}" method="post" novalidate data-qk-record>
      <@qk.field name="email" type="email" autocomplete="email" label=msg("qk.field.email")
                 value=(profile.attributesByName.email.value)!'' attrs="autofocus" />

      <#if !realm.registrationEmailAsUsername>
        <@qk.field name="username" autocomplete="username" label=msg("qk.field.username")
                   value=(profile.attributesByName.username.value)!'' />
      </#if>

      <@qk.field name="nickname" autocomplete="nickname" label=msg("qk.field.nickname") hint=msg("qk.field.nickname.hint")
                 value=(profile.attributesByName.nickname.value)!'' attrs="maxlength=\"32\" data-qk-label-source" />

      <@qk.password name="password" autocomplete="new-password" label=msg("qk.field.password") confirm=true />
      <#-- Keycloak checks the password against its confirmation; the script fills this one in. -->
      <input type="hidden" name="password-confirm" data-qk-confirm>
      <noscript>
        <div class="qk-field">
          <label for="password-confirm">${msg("qk.field.passwordConfirm")}</label>
          <input id="password-confirm" name="password-confirm" type="password" autocomplete="new-password">
        </div>
      </noscript>

      <#if recaptchaRequired?? && (recaptchaVisible!true)>
        <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}"></div>
      </#if>

      <button class="qk-btn" type="submit"><i aria-hidden="true"></i>${msg("qk.register.submit")}</button>
    </form>

    <p class="qk-switch">${msg("qk.register.haveAccount")} <a href="${url.loginUrl}">${msg("qk.register.toLogin")}</a></p>
  <#elseif section = "socialProviders">
    <#if social?? && social.providers?has_content>
      <div class="qk-divider"><span>${msg("qk.or")}</span></div>
      <div class="qk-social">
        <#list social.providers as p>
          <a class="qk-btn qk-btn--ghost qk-btn--${p.alias}" href="${p.loginUrl}">${msg("qk.social.continue", p.displayName!p.alias)}</a>
        </#list>
      </div>
    </#if>
  </#if>
</@layout.registrationLayout>
