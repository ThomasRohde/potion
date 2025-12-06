$ErrorActionPreference = "Stop"

Write-Host "🧪 Initializing Potion development environment..." -ForegroundColor Cyan

# Check for Bun
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Bun is not installed. Please install from https://bun.sh" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
bun install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Running type check..." -ForegroundColor Yellow
bun run typecheck

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Type check failed, but continuing..." -ForegroundColor Yellow
}

Write-Host "🚀 Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Server will be available at: http://localhost:5173" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

bun run dev
