<#import "template.ftl" as layout>
<@layout.emailLayout title=msg("passwordResetTitle")>
${kcSanitize(msg("passwordResetBodyHtmlNoLink", realmName))?no_esc}
<table width='100%' cellpadding='0' cellspacing='0' border='0' role='presentation'><tr><td align='center' style='padding: 1rem 0;'><table width='100%' cellpadding='0' cellspacing='0' border='0' role='presentation'><tr><td bgcolor='#ed3e3e' style='background-color: #ed3e3e; border-radius: 10px; text-align: center;'><a href="${link}" style='display: block; width: 100%; padding: 14px 24px; color: #ffffff; font-weight: 600; text-decoration: none; text-align: center; box-sizing: border-box; font-size: 16px;'>${msg("passwordResetLinkText")}</a></td></tr></table></td></tr></table>
${kcSanitize(msg("passwordResetBodyHtmlAfter", linkExpirationFormatter(linkExpiration)))?no_esc}
</@layout.emailLayout>
