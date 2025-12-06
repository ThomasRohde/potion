#!/bin/bash
# Long-Running Agent Environment Initialization Script
# This script sets up the development environment for agent sessions

set -e  # Exit on any error

echo "🚀 Starting development environment..."
echo "================================================"

# 1. Check prerequisites
echo "📋 Checking prerequisites..."

# Example: Check Node.js version
# if ! command -v node &> /dev/null; then
#     echo "❌ Node.js is required but not installed"
#     exit 1
# fi
# echo "   ✅ Node.js $(node -v)"

# Example: Check Python version
# if ! command -v python3 &> /dev/null; then
#     echo "❌ Python 3 is required but not installed"
#     exit 1
# fi
# echo "   ✅ Python $(python3 --version)"

# 2. Install dependencies
echo ""
echo "📦 Installing dependencies..."

# Example for Node.js projects:
# npm install

# Example for Python projects:
# pip install -r requirements.txt

# Example for Rust projects:
# cargo build

echo "   ✅ Dependencies installed"

# 3. Set up environment variables (if needed)
echo ""
echo "🔧 Setting up environment..."

# Example: Load .env file
# if [ -f .env ]; then
#     export $(cat .env | grep -v '^#' | xargs)
#     echo "   ✅ Environment variables loaded from .env"
# fi

# 4. Start development server (background)
echo ""
echo "🖥️  Starting development server..."

# Example for Node.js:
# npm run dev &

# Example for Python Flask:
# python app.py &

# Example for Django:
# python manage.py runserver &

# Store the PID for later cleanup
# DEV_SERVER_PID=$!
# echo $DEV_SERVER_PID > .dev-server.pid

# 5. Wait for server to be ready
echo "   ⏳ Waiting for server to start..."
sleep 3

# 6. Health check
echo ""
echo "🏥 Running health check..."

# Example: Check if HTTP endpoint responds
# if curl -sf http://localhost:3000/health > /dev/null; then
#     echo "   ✅ Health check passed"
# else
#     echo "   ❌ Health check failed"
#     exit 1
# fi

# 7. Success message
echo ""
echo "================================================"
echo "✅ Environment ready!"
echo ""
echo "📍 Server running at: http://localhost:3000"
echo "📖 To stop: kill \$(cat .dev-server.pid)"
echo ""
echo "🎯 Ready for coding session. Run /session-start"
echo "================================================"
