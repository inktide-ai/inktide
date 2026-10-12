<#--
  The broadcast frame every Keycloak page sits in: the landing's black bar, REC corners and the
  hatched road. Pages may fill two extra sections the base theme doesn't know about:
    "chip"  - the small skewed label above the title
    "stage" - the left half on desktop (the tape and the deck on login and sign-up)
  Base pages that don't fill them (errors, info, update password...) get a single panel.
-->
<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<#assign chip><#nested "chip"></#assign>
<#assign stage><#nested "stage"></#assign>
<#assign hasStage = stage?markup_string?trim?has_content>
<!DOCTYPE html>
<html lang="${(locale.currentLanguageTag)!'en'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${msg("qk.pageTitle")}</title>
  <link rel="icon" href="${url.resourcesPath}/img/quackie-icon.svg" type="image/svg+xml">
  <link rel="preload" href="${url.resourcesPath}/fonts/mona-sans-latin-wdth-italic.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${url.resourcesPath}/css/quackie.css?v=${properties.qkAssetsVersion!}">
  <script src="${url.resourcesPath}/js/quackie.js?v=${properties.qkAssetsVersion!}" defer></script>
</head>
<body class="qk ${bodyClass}">
  <header class="qk-bar">
    <img class="qk-logo" src="${url.resourcesPath}/img/quackie-logo-dark.svg" alt="Quackie" width="132" height="24">
    <div class="qk-bar__right">
      <#if realm.internationalizationEnabled && locale.supported?size gt 1>
        <nav class="qk-locales" aria-label="${msg("qk.language")}">
          <#list locale.supported as l>
            <a href="${l.url}" lang="${l.languageTag}"<#if l.languageTag == locale.currentLanguageTag> class="is-current" aria-current="true"</#if>>${l.languageTag?upper_case}</a>
          </#list>
        </nav>
      </#if>
      <span class="qk-rec"><i aria-hidden="true"></i>REC <span data-qk-timecode>00:00:00:00</span></span>
    </div>
  </header>

  <div class="qk-corners" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
  <div class="qk-road" aria-hidden="true"></div>

  <#-- <main> scrolls, not the page: a classic scrollbar (Mac with a mouse) then starts under the
       fixed bar instead of cutting it short, whatever the window's height. -->
  <main class="qk-main">
    <div class="qk-main__inner<#if hasStage> has-stage</#if>">
      <#if hasStage>
        <section class="qk-stage" aria-hidden="true">${stage}</section>
      </#if>

      <section class="qk-panel">
        <div class="qk-panel__inner">
          <#if chip?markup_string?trim?has_content><span class="qk-chip">${chip}</span></#if>
          <h1 class="qk-title"><#nested "header"></h1>

          <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
            <div class="qk-alert qk-alert--${message.type}" role="alert">${kcSanitize(message.summary)?no_esc}</div>
          </#if>

          <#nested "form">
          <#nested "socialProviders">

          <#if displayInfo>
            <div class="qk-info"><#nested "info"></div>
          </#if>
        </div>
      </section>
    </div>
  </main>
</body>
</html>
</#macro>
