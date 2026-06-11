namespace Inktide.API.Profile.Infrastructure.Templates;

internal static class EmailChangeFailedTemplate
{
    internal static string Build() => """
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="font-size:18px;margin-bottom:8px">Email change failed</h2>
          <p style="color:#6b7280;margin-bottom:16px">
            We were unable to update your email address after several attempts.
            Please go to your account settings and try again.
          </p>
          <p style="color:#6b7280">
            If the problem persists, please contact support.
          </p>
        </div>
        """;
}
