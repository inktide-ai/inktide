#!/usr/bin/env bash
# Pulls the local Ollama models used for embeddings, emotion checks and Scribe's
# fact extraction, and creates the 4-thread chat model the stack is configured for.
#   ./setup-models.sh
# Ollama otherwise starts one thread per core and, on a VM without hyperthreads,
# takes every core while Scribe extracts facts after a reply, leaving Kokoro to
# voice the next reply ~7x slower. Four threads leave the other half to the voice.
set -euo pipefail
cd "$(dirname "$0")"

ollama() { docker compose exec -T ollama ollama "$@"; }

ollama pull nomic-embed-text
ollama pull qwen2.5:1.5b
printf 'FROM qwen2.5:1.5b\nPARAMETER num_thread 4\n' \
  | docker compose exec -T ollama sh -c 'cat > /tmp/Modelfile && ollama create qwen2.5-1.5b-4t -f /tmp/Modelfile'
ollama list
