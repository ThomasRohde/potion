#!/bin/bash
set -e

echo "🧪 Initializing Potion development environment..."

# Check for Bun
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install from https://bun.sh"
    exit 1
fi

echo "📦 Installing dependencies..."
bun install

echo "🔍 Running type check..."
bun run typecheck || echo "⚠️  Type check failed, but continuing..."

echo "🚀 Starting development server..."
echo ""
echo "Server will be available at: http://localhost:5173"
echo "Press Ctrl+C to stop the server"
echo ""

bun run dev
