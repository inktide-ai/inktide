.PHONY: run build up down install test pull-model lint

run:
	uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

install:
	pip install -r requirements.txt

test:
	pytest tests/ -v

lint:
	ruff check app/ tests/
	ruff format --check app/ tests/

build:
	docker build -t inktide-scribe-model .

up:
	docker compose up -d

down:
	docker compose down

pull-model:
	ollama pull qwen2.5
