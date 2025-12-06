# Long-Running Agent Environment Initialization Script (PowerShell)
# This script sets up the development environment for agent sessions

$ErrorActionPreference = "Stop"  # Exit on any error

Write-Host "🚀 Starting development environment..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# 1. Check prerequisites
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow

# Example: Check Node.js version
# if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
#     Write-Host "❌ Node.js is required but not installed" -ForegroundColor Red
#     exit 1
# }
# Write-Host "   ✅ Node.js $(node -v)" -ForegroundColor Green

# Example: Check Python version
# if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
#     Write-Host "❌ Python is required but not installed" -ForegroundColor Red
#     exit 1
# }
# Write-Host "   ✅ Python $(python --version)" -ForegroundColor Green

# 2. Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow

# Example for Node.js projects:
# npm install

# Example for Python projects:
# pip install -r requirements.txt

# Example for .NET projects:
# dotnet restore

Write-Host "   ✅ Dependencies installed" -ForegroundColor Green

# 3. Set up environment variables (if needed)
Write-Host "`n🔧 Setting up environment..." -ForegroundColor Yellow

# Example: Load .env file
# if (Test-Path .env) {
#     Get-Content .env | ForEach-Object {
#         if ($_ -match '^([^#][^=]+)=(.*)$') {
#             [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
#         }
#     }
#     Write-Host "   ✅ Environment variables loaded from .env" -ForegroundColor Green
# }

# 4. Start development server (background)
Write-Host "`n🖥️  Starting development server..." -ForegroundColor Yellow

# Example for Node.js:
# $serverProcess = Start-Process -NoNewWindow -PassThru npm -ArgumentList "run", "dev"
# $serverProcess.Id | Out-File .dev-server.pid

# Example for Python:
# $serverProcess = Start-Process -NoNewWindow -PassThru python -ArgumentList "app.py"
# $serverProcess.Id | Out-File .dev-server.pid

# Example for .NET:
# $serverProcess = Start-Process -NoNewWindow -PassThru dotnet -ArgumentList "run"
# $serverProcess.Id | Out-File .dev-server.pid

# 5. Wait for server to be ready
Write-Host "   ⏳ Waiting for server to start..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# 6. Health check
Write-Host "`n🏥 Running health check..." -ForegroundColor Yellow

# Example: Check if HTTP endpoint responds
# try {
#     $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
#     if ($response.StatusCode -eq 200) {
#         Write-Host "   ✅ Health check passed" -ForegroundColor Green
#     }
# } catch {
#     Write-Host "   ❌ Health check failed: $_" -ForegroundColor Red
#     exit 1
# }

# 7. Success message
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "✅ Environment ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Server running at: http://localhost:3000" -ForegroundColor White
Write-Host "📖 To stop: Stop-Process -Id (Get-Content .dev-server.pid)" -ForegroundColor Gray
Write-Host ""
Write-Host "🎯 Ready for coding session. Run /session-start" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
