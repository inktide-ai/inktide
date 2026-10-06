# Silero TTS (Russian)

[Silero](https://github.com/snakers4/silero-models) `v4_ru` behind the HTTP API of
Kokoro-FastAPI, so the TTS module uses it as the `silero` speech provider the same way it
uses Kokoro. Kokoro has no Russian voices; this service is the Russian voice of the stack.

| Endpoint | |
|---|---|
| `POST /v1/audio/speech` | `{"input", "voice", "response_format": "wav"\|"pcm"\|"mp3", "speed"}` |
| `GET /v1/audio/voices` | `{"voices": ["xenia", "kseniya", "baya", "aidar", "eugene"]}` |
| `GET /v1/models` | OpenAI-style model list |
| `GET /health` | liveness |

Silero pronounces Cyrillic only, so `app/normalize.py` spells numbers as Russian words and
transliterates Latin words (`Quackie` -> `кваки`, `Twitch` -> `твич`) before synthesis.
Unknown voices fall back to `SILERO_DEFAULT_VOICE` (`xenia`).

Environment: `SILERO_THREADS` (4), `SILERO_SAMPLE_RATE` (48000), `SILERO_DEFAULT_VOICE`.
