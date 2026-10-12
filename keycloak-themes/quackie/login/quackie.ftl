<#-- Pieces shared by the Quackie pages: the tape and its deck, and the form fields. -->

<#--
  A VHS tape above a deck. The label shows `label`, or `placeholder` while it is blank; an input
  marked data-qk-label-source writes into it as you type. Submitting the form slides the tape into
  the deck and lights its LED: red for "rec" (sign up), green for "play" (log in).
-->
<#macro tape label placeholder mode="rec">
  <div class="qk-deck" data-qk-deck data-mode="${mode}">
    <div class="qk-deck__window">
      <div class="qk-tape">
        <div class="qk-tape__label">
          <span class="qk-tape__name<#if !label?has_content> is-blank</#if>" data-qk-label data-placeholder="${placeholder}"><#if label?has_content>${label}<#else>${placeholder}</#if></span>
          <span class="qk-tape__meta">SP · T-∞</span>
        </div>
        <div class="qk-tape__window"><span class="qk-reel"></span><span class="qk-reel"></span></div>
      </div>
    </div>
    <div class="qk-vcr">
      <span class="qk-vcr__slot"></span>
      <span class="qk-vcr__led"></span>
      <span class="qk-vcr__state">${(mode == "play")?then("PLAY", "REC")}</span>
    </div>
  </div>
</#macro>

<#macro field name label value="" type="text" autocomplete="off" hint="" attrs="">
  <#assign failed = messagesPerField.existsError(name)>
  <div class="qk-field<#if failed> has-error</#if>">
    <label for="${name}">${label}</label>
    <input id="${name}" name="${name}" type="${type}" value="${value}" autocomplete="${autocomplete}"
           aria-invalid="${failed?c}"<#if failed> aria-describedby="${name}-error"<#elseif hint?has_content> aria-describedby="${name}-hint"</#if> ${attrs?no_esc}>
    <#if failed>
      <span id="${name}-error" class="qk-field__error" aria-live="polite">${kcSanitize(messagesPerField.get(name))?no_esc}</span>
    <#elseif hint?has_content>
      <span id="${name}-hint" class="qk-field__hint">${hint}</span>
    </#if>
  </div>
</#macro>

<#--
  `confirm`: the form also posts `${name}-confirm` (sign-up, new password), whose errors show here too.
  `failedWith`: a field whose error belongs under this one, e.g. login's "invalid username or password".
-->
<#macro password name label autocomplete confirm=false failedWith="">
  <#if confirm>
    <#assign failed = messagesPerField.existsError(name, name + "-confirm")>
    <#assign error = failed?then(messagesPerField.getFirstError(name, name + "-confirm"), "")>
  <#elseif failedWith?has_content>
    <#assign failed = messagesPerField.existsError(failedWith, name)>
    <#assign error = failed?then(messagesPerField.getFirstError(failedWith, name), "")>
  <#else>
    <#assign failed = messagesPerField.existsError(name)>
    <#assign error = failed?then(messagesPerField.get(name), "")>
  </#if>
  <div class="qk-field<#if failed> has-error</#if>">
    <label for="${name}">${label}</label>
    <div class="qk-pass">
      <input id="${name}" name="${name}" type="password" autocomplete="${autocomplete}"
             aria-invalid="${failed?c}"<#if failed> aria-describedby="${name}-error"</#if>>
      <button type="button" class="qk-pass__toggle" data-qk-toggle="${name}" aria-pressed="false"
              aria-label="${msg("qk.password.show")}" data-show="${msg("qk.password.show")}" data-hide="${msg("qk.password.hide")}">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>
        </svg>
      </button>
    </div>
    <#if failed>
      <span id="${name}-error" class="qk-field__error" aria-live="polite">${kcSanitize(error)?no_esc}</span>
    </#if>
  </div>
</#macro>
