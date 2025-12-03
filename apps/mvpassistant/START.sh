#!/bin/bash

# ============================================================
# MVP Assistant - Server Runner
# ============================================================
# This script starts the backend and frontend servers
# Make sure to run INSTALL.sh first
# ============================================================

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
cd "$SCRIPT_DIR"

# If running from Finder/double-click, open in Terminal
if [ -z "$TERM" ] || [ "$TERM" = "dumb" ]; then
    osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$SCRIPT_DIR' && bash '$SCRIPT_DIR/START.sh'"
end tell
EOF
    exit 0
fi

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required. Please run ./INSTALL.sh first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "backend/venv" ] || [ ! -d "frontend/node_modules" ]; then
    echo "❌ Dependencies not installed. Please run ./INSTALL.sh first."
    exit 1
fi

# Check if Ollama is running
if ! curl -s http://localhost:11434 > /dev/null 2>&1; then
    echo "⚠️  Ollama is not running. Starting it..."
    ollama serve > /dev/null 2>&1 &
    sleep 5
fi

echo "🚀 Starting MVP Assistant..."
echo ""

# Read ports from AssistantAI ports.json
PORTS_FILE="$PROJECT_ROOT/config/ports.json"
if [ -f "$PORTS_FILE" ]; then
    # Use Python to handle paths with spaces properly
    if command -v python3 &> /dev/null; then
        BACKEND_PORT=$(python3 -c "import json, os; config = json.load(open(os.path.expanduser('$PORTS_FILE'))); app = next((a for a in config['apps'] if a['id'] == 'mvpassistant-backend'), None); print(app['port'] if app else 4201)")
        FRONTEND_PORT=$(python3 -c "import json, os; config = json.load(open(os.path.expanduser('$PORTS_FILE'))); app = next((a for a in config['apps'] if a['id'] == 'mvpassistant-frontend'), None); print(app['port'] if app else 4204)")
    elif command -v node &> /dev/null; then
        # Use fs.readFileSync to handle paths with spaces
        BACKEND_PORT=$(node -e "const fs = require('fs'); const config = JSON.parse(fs.readFileSync('$PORTS_FILE', 'utf8')); const app = config.apps.find(a => a.id === 'mvpassistant-backend'); console.log(app ? app.port : 4201);")
        FRONTEND_PORT=$(node -e "const fs = require('fs'); const config = JSON.parse(fs.readFileSync('$PORTS_FILE', 'utf8')); const app = config.apps.find(a => a.id === 'mvpassistant-frontend'); console.log(app ? app.port : 4204);")
    else
        # Fallback to defaults
        BACKEND_PORT=4201
        FRONTEND_PORT=4204
    fi
else
    # Fallback to defaults if ports.json doesn't exist
    BACKEND_PORT=${MVP_BACKEND_PORT:-4201}
    FRONTEND_PORT=${MVP_FRONTEND_PORT:-4204}
fi

echo "Backend port: $BACKEND_PORT"
echo "Frontend port: $FRONTEND_PORT"
echo ""

# Activate virtual environment
cd "$SCRIPT_DIR"
source backend/venv/bin/activate

# Start backend server
echo "📡 Starting backend server (port $BACKEND_PORT)..."
cd "$SCRIPT_DIR/backend"
export PORT=$BACKEND_PORT
uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🌐 Starting frontend server (port $FRONTEND_PORT)..."
cd "$SCRIPT_DIR/frontend"
export PORT=$FRONTEND_PORT
npm run dev -- -p $FRONTEND_PORT -H 0.0.0.0 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

# Save PIDs
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

echo ""
echo "⏳ Waiting for servers to start (this may take 15-20 seconds)..."
sleep 20

# Check if servers are ready
MAX_RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        echo "✅ Frontend server is ready!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   Waiting for frontend... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

echo ""
echo "✅ MVP Assistant is running!"
echo ""
echo "📍 Access the application at:"
echo "   Frontend:  http://localhost:$FRONTEND_PORT"
echo "   Backend:   http://localhost:$BACKEND_PORT"
echo ""
echo "🛑 To stop the servers, press Ctrl+C or run:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Open browser
echo "🌐 Opening MVP Assistant in your browser..."
open http://localhost:$FRONTEND_PORT/ 2>/dev/null || xdg-open http://localhost:$FRONTEND_PORT/ 2>/dev/null || echo "Please manually open http://localhost:$FRONTEND_PORT/ in your browser"

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Keep script running
wait

