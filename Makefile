.PHONY: help local check format test clean run-data

help:
	@echo "worldcup2026 — commands"
	@echo ""
	@echo "  make local     — uv venv + dev dependencies + pre-commit hooks"
	@echo "  make check     — ruff check + mypy"
	@echo "  make format    — ruff format"
	@echo "  make test      — pre-commit on all files"
	@echo "  make run-data  — download match data from Kaggle and preview"
	@echo "  make clean     — remove caches, build artifacts, and .venv"

local:
	@if ! command -v uv >/dev/null 2>&1; then \
		echo "Installing uv..."; \
		curl -LsSf https://astral.sh/uv/install.sh | sh; \
	fi
	uv python install
	uv sync --extra dev
	uv run pre-commit install
	mkdir -p data
	@echo "Done. Activate: source .venv/bin/activate  or use: uv run <command>"

check:
	uv run ruff check src/ notebooks/
	uv run mypy src/

format:
	uv run ruff format src/ notebooks/

test:
	uv run pre-commit run --all-files

run-data:
	uv run python src/fetch_kaggle_dataset.py

clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	rm -rf .pytest_cache .ruff_cache .mypy_cache build dist *.egg-info .venv
	@echo "Cleanup done (uv.lock kept; rm uv.lock to regenerate)"
