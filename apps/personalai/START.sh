#!/bin/bash

# PersonalAI Start Script for AssistantAI
# This script starts PersonalAI using ports assigned by AssistantAI port manager

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
cd "$SCRIPT_DIR"

# Read ports from AssistantAI ports.json
PORTS_FILE="$PROJECT_ROOT/config/ports.json"
if [ -f "$PORTS_FILE" ]; then
    # Use Python to handle paths with spaces properly
    if command -v python3 &> /dev/null; then
        BACKEND_PORT=$(python3 -c "import json, os; config = json.load(open(os.path.expanduser('$PORTS_FILE'))); app = next((a for a in config['apps'] if a['id'] == 'personalai-backend'), None); print(app['port'] if app else 4202)")
        FRONTEND_PORT=$(python3 -c "import json, os; config = json.load(open(os.path.expanduser('$PORTS_FILE'))); app = next((a for a in config['apps'] if a['id'] == 'personalai-frontend'), None); print(app['port'] if app else 4203)")
    elif command -v node &> /dev/null; then
        # Use fs.readFileSync to handle paths with spaces
        BACKEND_PORT=$(node -e "const fs = require('fs'); const config = JSON.parse(fs.readFileSync('$PORTS_FILE', 'utf8')); const app = config.apps.find(a => a.id === 'personalai-backend'); console.log(app ? app.port : 4202);")
        FRONTEND_PORT=$(node -e "const fs = require('fs'); const config = JSON.parse(fs.readFileSync('$PORTS_FILE', 'utf8')); const app = config.apps.find(a => a.id === 'personalai-frontend'); console.log(app ? app.port : 4203);")
    else
        # Fallback to defaults
        BACKEND_PORT=4202
        FRONTEND_PORT=4203
    fi
else
    # Fallback to defaults if ports.json doesn't exist
    BACKEND_PORT=4202
    FRONTEND_PORT=4203
fi

echo "Starting PersonalAI..."
echo "Backend port: $BACKEND_PORT"
echo "Frontend port: $FRONTEND_PORT"
echo ""

# Check if dependencies are installed
if [ ! -d "backend/venv" ]; then
    echo "❌ Backend dependencies not installed. Please run: npm run install:backend"
    exit 1
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "❌ Frontend dependencies not installed. Please run: npm run install:frontend"
    exit 1
fi

# Start backend
echo "Starting backend on port $BACKEND_PORT..."
cd "$SCRIPT_DIR/backend"
source venv/bin/activate
export PORT=$BACKEND_PORT
uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT > ../../logs/personalai-backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../../logs/personalai-backend.pid
echo "Backend started (PID: $BACKEND_PID)"

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "Starting frontend on port $FRONTEND_PORT..."
cd "$SCRIPT_DIR/frontend"
export PORT=$FRONTEND_PORT
npm run dev -- -p $FRONTEND_PORT -H 0.0.0.0 > ../../logs/personalai-frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../../logs/personalai-frontend.pid
echo "Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "✅ PersonalAI started!"
echo "Backend: http://localhost:$BACKEND_PORT"
echo "Frontend: http://localhost:$FRONTEND_PORT"
echo ""
echo "Logs:"
echo "  - Backend: ../../logs/personalai-backend.log"
echo "  - Frontend: ../../logs/personalai-frontend.log"
