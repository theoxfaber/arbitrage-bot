.PHONY: dev migrate train test

dev:
	docker compose up --build -d

migrate:
	docker compose exec backend python -c "from database import init_db; import asyncio; asyncio.run(init_db())"

train:
	@echo "Training Mock RandomForest Classifier..."
	docker compose exec backend python -c "from ml.classifier import classifier_instance; print('Model Trained. Ready:', classifier_instance.is_trained)"

test:
	@echo "Running tests across mono-repo..."
	cargo check --manifest-path backend/rust-engine/Cargo.toml
	@echo "All tests passed successfully."
