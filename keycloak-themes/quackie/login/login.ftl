<#import "template.ftl" as layout>
<#import "quackie.ftl" as qk>
<#-- Login: your tape goes back in the deck. The label reads the email's name as you type; PLAY logs in. -->
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=(realm.password && realm.registrationAllowed && !registrationDisabled??); section>
  <#if section = "chip">
    ${msg("qk.login.chip")}
  <#elseif section = "header">
    ${msg("qk.login.title")}
  <#elseif section = "stage">
    <@qk.tape label="" placeholder=msg("qk.label.login") mode="play" />
  <#elseif section = "form">
    <p class="qk-lead">${msg("qk.login.lead")}</p>

    <#if realm.password>
      <form class="qk-form" action="${url.loginAction}" method="post" novalidate data-qk-record>
        <#if !usernameHidden??>
          <#assign failed = messagesPerField.existsError('username','password')>
          <div class="qk-field<#if failed> has-error</#if>">
            <label for="username">${msg(realm.loginWithEmailAllowed?then("qk.field.email", "qk.field.username"))}</label>
            <input id="username" name="username" type="text" value="${(login.username!'')}" autocomplete="username"
                   autofocus aria-invalid="${failed?c}" data-qk-label-source data-qk-label-mode="email">
          </div>
        </#if>

        <@qk.password name="password" autocomplete="current-password" label=msg("qk.field.password") failedWith="username" />

        <#if realm.resetPasswordAllowed>
          <a class="qk-forgot" href="${url.loginResetCredentialsUrl}">${msg("qk.login.forgot")}</a>
        </#if>

        <input type="hidden" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>>
        <button class="qk-btn" type="submit"><i class="is-play" aria-hidden="true"></i>${msg("qk.login.submit")}</button>
      </form>
    </#if>
  <#elseif section = "socialProviders">
    <#if realm.password && social?? && social.providers?has_content>
      <div class="qk-divider"><span>${msg("qk.or")}</span></div>
      <div class="qk-social">
        <#list social.providers as p>
          <a class="qk-btn qk-btn--ghost qk-btn--${p.alias}" href="${p.loginUrl}">${msg("qk.social.continue", p.displayName!p.alias)}</a>
        </#list>
      </div>
    </#if>
  <#elseif section = "info">
    <p class="qk-switch">${msg("qk.login.noAccount")} <a href="${url.registrationUrl}">${msg("qk.login.toRegister")}</a></p>
  </#if>
</@layout.registrationLayout>
