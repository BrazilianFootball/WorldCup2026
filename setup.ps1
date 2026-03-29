# setup.ps1 — Windows environment setup for worldcup2026

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Host "Installing uv..."
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "User") + ";" + $env:Path
}

Write-Host "Installing Python..."
uv python install

Write-Host "Installing dependencies..."
uv sync --extra dev

Write-Host "Setting up pre-commit hooks..."
uv run pre-commit install

if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" | Out-Null
}

Write-Host "Done. Use: uv run <command>"
