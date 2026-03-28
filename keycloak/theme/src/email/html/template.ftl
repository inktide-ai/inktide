<#macro emailLayout title="">
<!DOCTYPE html>
<html lang="${locale.language}" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chimera</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0e;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0e;">
        <tr>
            <td align="center" style="padding: 2rem;">
                <table role="presentation" align="center" cellspacing="0" cellpadding="0" style="max-width: 420px;">
                    <tr>
                        <td style="padding-bottom: 1.5rem; text-align: left;">
                            <table role="presentation" cellspacing="0" cellpadding="0" align="left">
                                <tr>
                                    <#if properties?? && properties.companyLogoUrl?? && properties.companyLogoUrl?has_content>
                                    <td style="vertical-align: middle; padding-right: 0.75rem;">
                                        <img src="${properties.companyLogoUrl}" alt="Chimera" width="40" height="40" style="display: block;" />
                                    </td>
                                    </#if>
                                    <td style="vertical-align: middle;">
                                        <span style="font-size: 1.25rem; font-weight: 600; color: #ffffff;">Chimera</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 60px; background-color: #050509; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; box-shadow: 0 24px 64px rgba(0,0,0,0.5);">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 2.5rem 0;">
                                <#if title?has_content>
                                <tr>
                                    <td style="padding: 0 0 1rem 0;">
                                        <h1 style="margin: 0; font-size: 1.25rem; font-weight: 600; color: #ffffff; line-height: 1.4;">${title}</h1>
                                    </td>
                                </tr>
                                </#if>
                                <tr>
                                    <td style="padding: 0; color: rgba(255,255,255,0.9); font-size: 14px; line-height: 16px;">
                                        <#nested>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 1.5rem 0 0 0; border-top: 1px solid rgba(255,255,255,0.08); font-size: 14px; line-height: 16px; color: rgba(255,255,255,0.7);">
                                        Questions? Contact us at <a href="mailto:hi@chimera.com" style="color: #FF5252; text-decoration: none;">hi@chimera.com</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
</#macro>
