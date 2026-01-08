.PHONY: infra init build services up obs scheduler simulator perf perf-grafana down clean

# Default scale factor
N ?= 1
# Perf test scenario to run (path to js file)
SCENARIO ?= chat-api


# Start infrastructure services (postgres, redis)
infra:
	docker compose -f docker/docker-compose.infra.yaml up -d

# Start observability services (prometheus, grafana, loki)
obs:
	docker compose -f docker/docker-compose.obs.yaml up -d

# Start scheduler (resets db, logs, metrics every 30 min)
scheduler:
	docker compose -f docker/docker-compose.scheduler.yaml --env-file .env --env-file ./docker/.env.docker up -d

# Start simulator (load testing)
simulator:
	docker compose -f docker/docker-compose.simulator.yaml --env-file .env --env-file ./docker/.env.docker up -d

# Run performance tests with k6 (usage: make perf SCENARIO=auth-flow)
perf:
	docker compose -f docker/docker-compose.perf.yaml --env-file .env --env-file ./docker/.env.docker run --rm k6 run /scripts/$(SCENARIO).js

# Run k6 with Prometheus/Grafana export (usage: make perf-grafana SCENARIO=auth-flow)
perf-grafana:
	docker compose -f docker/docker-compose.perf.yaml --env-file .env --env-file ./docker/.env.docker run --rm \
		k6 run --out experimental-prometheus-rw /scripts/$(SCENARIO).js

# Initialize database schema (run once or when schema changes)
init:
	docker compose -f docker/docker-compose.infra.yaml -f docker/docker-compose.init.yaml up db-init

# Build images with optimal cache reuse
build:
	docker compose -f docker/docker-compose.services.yaml --env-file .env --env-file ./docker/.env.docker build 

# Start application services with scaling
services:
	docker compose -f docker/docker-compose.services.yaml --env-file .env --env-file ./docker/.env.docker up -d \
		--scale identity=$(N) \
		--scale chat=$(N) \
		--scale web=$(N) \
		--scale persister=$(N)

# Regular startup (infra + services)
up: infra
	$(MAKE) services

# Stop all services
down:
	docker compose -f docker/docker-compose.perf.yaml down
	docker compose -f docker/docker-compose.scheduler.yaml down
	docker compose -f docker/docker-compose.simulator.yaml down
	docker compose -f docker/docker-compose.services.yaml down
	docker compose -f docker/docker-compose.obs.yaml down
	docker compose -f docker/docker-compose.infra.yaml down

# Stop and remove volumes
clean:
	docker compose -f docker/docker-compose.perf.yaml down -v
	docker compose -f docker/docker-compose.scheduler.yaml down -v
	docker compose -f docker/docker-compose.simulator.yaml down -v
	docker compose -f docker/docker-compose.services.yaml down -v
	docker compose -f docker/docker-compose.obs.yaml down -v
	docker compose -f docker/docker-compose.infra.yaml down -v
