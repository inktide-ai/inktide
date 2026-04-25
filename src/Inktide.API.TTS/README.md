# Inktide.API.TTS (bounded context)

Layers (DDD / hexagonal):

| Project | Responsibility |
|---------|----------------|
| **Inktide.API.TTS.Domain** | Models (`Models/`), domain exceptions (`Exceptions/`), speech **ports** (`Speech/`: `ISpeechProvider`, `ISpeechProviderRegistry`, `SpeechProviderRegistry`) |
| **Inktide.API.TTS.Application** | Use cases: `Synthesis/*` (`ITtsSynthesisService`, commands, results), application ports (`Abstractions/IApiKeyResolver`), options (`Configuration/TtsProviderOptions`), `SpeechProviderResolutionExtensions` |
| **Inktide.API.TTS.Infrastructure** | Adapters: Kokoro (`Kokoro/`), `TtsApiKeyResolver`, `Decorators/LoggingSpeechProviderDecorator`, **composition root** DI (`AddInktideTts`, `AddInktideSpeechProviders`, `InktideTtsStartup`) |
| **Inktide.API.TTS.REST.Models** | HTTP DTOs (`TtsSynthesizeRequest`, …) |
| **Inktide.API.TTS.REST** | Controllers, FluentValidation, `TtsRestApiStartup` |

Shared kernel: `IProvider`, `ProviderOptions`, `ProviderCategory` — `Inktide.API.Core` / `Inktide.API.Domain`.

### REST

- **POST** `/api/tts/synthesize` — JSON (`TtsSynthesizeRequest`): `text`, `voice_id`, optional `model_id`, `speed`, `provider_id`, `audio_format`, `stream`.
- **API key** (if provider `RequiresApiKey`): header `X-TTS-Api-Key` or `TtsProviders:{provider_id}:ApiKey`.
- **Response:** audio stream (see `SpeechResult.Ok` content type in application layer).
