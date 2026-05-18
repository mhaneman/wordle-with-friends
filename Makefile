.PHONY: up down logs build migrate prod-up prod-down prod-logs prod-build

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

prod-up:
	docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

prod-down:
	docker compose -f docker-compose.prod.yml --env-file .env.production down

prod-logs:
	docker compose -f docker-compose.prod.yml --env-file .env.production logs -f

prod-build:
	docker compose -f docker-compose.prod.yml --env-file .env.production build
