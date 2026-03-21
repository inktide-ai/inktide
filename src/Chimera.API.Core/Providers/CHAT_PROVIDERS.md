# Chat providers (enterprise layout)

| Layer | Location |
|-------|----------|
| **Contracts & DTOs** | `Chimera.API.Domain` — `ChatRequest`, `ChatResponse`, `ChatProviderDescriptor`, `ChatProviderCapabilities`, … |
| **IChatProvider** | `Chimera.API.Core` — no HTTP types |
| **Registry** | `IChatProviderRegistry` / `ChatProviderRegistry` — built once from `IEnumerable<IChatProvider>` (DI), validates unique ids |
| **Config** | `ChatProviderOptions` — `DefaultProviderId`, feature flags; bind section `ChatProviders` from configuration |
| **Secrets** | Do **not** store API keys in options/registry. Pass per call via `ProviderConfig` (filled from user secrets / vault at the edge). |
| **Observability** | `LoggingChatProviderDecorator`, `MetricsChatProviderDecorator` — wrap inner provider |
| **HTTP resilience** | `ChatProviderHttpResilienceExtensions.AddChimeraHttpResilience` (alias: `AddChimeraChatProviderHttpResilience`) on `IHttpClientBuilder` (Polly), not on the registry |
| **Registration** | `AddChimeraChatProviders` — registers concrete providers + decorators + registry |

The legacy `IProviderStore<T>` remains for optional use; chat stack prefers `IChatProviderRegistry`.
