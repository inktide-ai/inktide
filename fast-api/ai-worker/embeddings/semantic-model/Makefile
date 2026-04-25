.PHONY: run build up down install test extract-categories

run:
	uvicorn app.main:app --host 0.0.0.0 --port 8000

install:
	pip install -r requirements.txt

test:
	pytest tests/ -v

build:
	docker build -t inktide-semantic-model .

up:
	docker compose up -d

down:
	docker compose down

extract-categories:
	pip install datasets
	python scripts/extract_twitch_categories.py --gaming 200 --output data/stream_categories.json
