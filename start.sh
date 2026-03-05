#!/bin/bash

# Veridex - Quick Start Script
# Starts orchestrator and frontend together

set -e

echo "🚀 Starting Veridex..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Copy .env.example and add your OPENAI_API_KEY"
    exit 1
fi

# Check if OPENAI_API_KEY is set
if ! grep -q "OPENAI_API_KEY=sk-" .env; then
    echo "⚠️  OPENAI_API_KEY not set in .env"
    echo "Add your OpenAI API key to .env file"
    exit 1
fi

echo "✓ Environment configured"
echo ""

# Start orchestrator in background
echo "📡 Starting orchestrator..."
npm run orchestrator > orchestrator.log 2>&1 &
ORCHESTRATOR_PID=$!
echo "   PID: $ORCHESTRATOR_PID"
echo "   Logs: orchestrator.log"

# Wait for orchestrator to be ready
sleep 3

# Check if orchestrator is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Orchestrator failed to start"
    echo "Check orchestrator.log for errors"
    kill $ORCHESTRATOR_PID 2>/dev/null || true
    exit 1
fi

echo "✓ Orchestrator running on port 3001"
echo ""

# Start frontend
echo "🌐 Starting frontend..."
cd app && npm run dev &
FRONTEND_PID=$!
echo "   PID: $FRONTEND_PID"

echo ""
echo "========================================="
echo "✅ Veridex is running!"
echo "========================================="
echo ""
echo "📊 On-Chain Data: http://localhost:3000/dashboard"
echo "⚡ Live Feed:      http://localhost:3000/live"
echo "🤖 For Agents:    http://localhost:3000/skill.md"
echo ""
echo "🔑 Edit Controls Password: ethdenver2026"
echo ""
echo "Press Ctrl+C to stop everything"
echo ""

# Wait for user to stop
trap "echo ''; echo 'Stopping...'; kill $ORCHESTRATOR_PID $FRONTEND_PID 2>/dev/null || true; exit 0" INT
wait
