using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace Inktide.API.Connector.Telegram.Services;

public sealed class TelegramBotApiClient : ITelegramBotApiClient
{
    private readonly HttpClient _http;

    public TelegramBotApiClient(HttpClient http)
    {
        _http = http;
        _http.BaseAddress = new Uri("https://api.telegram.org/");
        _http.Timeout = TimeSpan.FromSeconds(5);
    }

    public async Task<string?> GetBotUsernameAsync(string botToken, CancellationToken ct = default)
    {
        try
        {
            var response = await _http.GetFromJsonAsync<TelegramApiResponse<BotInfo>>(
                $"bot{botToken}/getMe", ct);
            return response?.Ok == true ? response.Result?.Username : null;
        }
        catch
        {
            return null;
        }
    }

    private sealed class TelegramApiResponse<T>
    {
        [JsonPropertyName("ok")]     public bool Ok     { get; set; }
        [JsonPropertyName("result")] public T?   Result { get; set; }
    }

    private sealed class BotInfo
    {
        [JsonPropertyName("username")] public string? Username { get; set; }
    }
}
