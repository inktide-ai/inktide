# TTS / speech providers (same pattern as chat)

| Layer | Location |
|-------|----------|
| **Contracts (DTOs)** | `Chimera.API.TTS.Domain` — `SpeechRequest`, `SpeechProviderDescriptor`, `SpeechProviderCapabilities`, `VoiceInfo` |
| **ISpeechProvider** | `Chimera.API.TTS.Core` — no HTTP types |
| **Registry** | `ISpeechProviderRegistry` / `SpeechProviderRegistry` — from `IEnumerable<ISpeechProvider>` (DI), unique ids |
| **Config** | `TtsProviderOptions` — `DefaultProviderId`, feature flags; section `TtsProviders` |
| **Secrets** | Per call `ProviderOptions.ApiKey` when `SpeechProviderCapabilities.RequiresApiKey` (header `X-TTS-Api-Key` or `TtsProviders:{providerId}:ApiKey`) |
| **Observability** | `LoggingSpeechProviderDecorator` |
| **HTTP / adapters** | `Chimera.API.TTS.Infrastructure` — Kokoro `HttpClient`, Polly via `Chimera.API.Core` |
| **Composition** | `Chimera.API.TTS.Application` — `AddChimeraTts`, `ChimeraTtsStartup` |

Shared primitives from `Chimera.API.Domain`: `ModelInfo`, `ProviderConfig`, `ProviderCategory` (via `IProvider`).

Resolution: `ISpeechProviderRegistry.Resolve(IOptions<TtsProviderOptions>, requestedProviderId?)`.
