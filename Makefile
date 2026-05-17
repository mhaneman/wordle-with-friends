.PHONY: up down logs build migrate

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

build:
	docker compose build

migrate:
	docker compose exec api goose -dir migrations postgres "$$DATABASE_URL" up
