FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    NLTK_DATA=/usr/local/share/nltk_data

WORKDIR /app

RUN groupadd --gid 1000 app \
    && useradd --uid 1000 --gid app --shell /bin/bash --create-home app

COPY pyproject.toml .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install .

RUN python3 -c "import nltk; nltk.download('punkt'); nltk.download('punkt_tab')"

COPY app/ ./app/

RUN chown -R app:app /app
USER app

CMD ["python", "-m", "app.main"]
