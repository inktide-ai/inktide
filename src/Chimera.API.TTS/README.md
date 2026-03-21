# Chimera.API.TTS (modular)

| Project | Role |
|---------|------|
| **Chimera.API.TTS.Domain** | Speech DTOs: `SpeechRequest`, `VoiceInfo`, `SpeechProviderDescriptor`, … |
| **Chimera.API.TTS.Core** | `ISpeechProvider`, registry, options, decorators, `AddChimeraSpeechProviders` |
| **Chimera.API.TTS.Infrastructure** | Kokoro adapter, `HttpClient` + Polly, `AddChimeraTtsKokoroClients` |
| **Chimera.API.TTS.Application** | Composition: `AddChimeraTts`, `ChimeraTtsStartup` |
| **Chimera.API.TTS.REST.Models** | REST DTOs, e.g. `TtsSynthesizeRequest` |
| **Chimera.API.TTS.REST** | `TtsRestApiStartup`, `POST /api/tts/synthesize` → `audio/mpeg` |

Shared with the rest of Chimera: `IProvider`, `ProviderConfig`, `ModelInfo`, `ProviderCategory` (`Chimera.API.Core` / `Chimera.API.Domain`).

See `Chimera.API.TTS.Core/Providers/TTS_PROVIDERS.md`.

### REST

- **POST** `/api/tts/synthesize` — body JSON (`TtsSynthesizeRequest`): `text`, `voice_id`, optional `model_id`, `speed`, `provider_id`, `audio_format`.
- **API key:** only if the resolved provider sets `RequiresApiKey` — header `X-TTS-Api-Key`, or config `TtsProviders:{provider_id}:ApiKey`.
- **Response:** audio stream (`Content-Type` matches selected format).
