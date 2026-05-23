using Inktide.API.Profile.Infrastructure.Constants;

namespace Inktide.API.Profile.Infrastructure.Templates;

internal static class EmailChangeTemplate
{
    internal static string Build(string code) => $"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="font-size:18px;margin-bottom:8px">Verify your email</h2>
          <p style="color:#6b7280;margin-bottom:24px">
            Enter the code below in Inktide to confirm your new email address.
            It expires in {ProfileConstants.EmailChange.TtlMinutes} minutes.
          </p>
          <div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;
                      font-size:32px;font-weight:700;letter-spacing:6px;font-family:monospace">
            {code}
          </div>
        </div>
        """;
}
