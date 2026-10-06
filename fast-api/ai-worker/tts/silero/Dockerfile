FROM python:3.12-slim

LABEL org.opencontainers.image.title="Inktide Silero TTS"
LABEL org.opencontainers.image.description="Russian speech (Silero v4_ru) behind the Kokoro-FastAPI / OpenAI audio API"

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

RUN groupadd --gid 1000 app \
    && useradd --uid 1000 --gid app --shell /bin/bash --create-home app

# CPU-only PyTorch: the CUDA build is several gigabytes and this runs on CPU.
RUN pip install --no-cache-dir torch==2.5.1 --index-url https://download.pytorch.org/whl/cpu
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# The model ships inside the image so the service starts without internet access.
ADD --chown=app:app https://models.silero.ai/models/tts/ru/v4_ru.pt /app/models/v4_ru.pt

COPY app/ ./app/

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
