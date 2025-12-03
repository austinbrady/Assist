#!/bin/bash

# AssisantAI - Unified Startup Script
# Starts all services (middleware, hub, backends, frontends) with correct ports

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Get project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Create logs directory
mkdir -p logs

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 Starting AssisantAI${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Run update script if it exists
if [ -f "update.sh" ]; then
    echo -e "${BLUE}🔄 Running auto-update check...${NC}"
    bash update.sh || {
        echo -e "${YELLOW}⚠️  Update check failed, continuing anyway...${NC}"
    }
    echo ""
fi

# Read ports from config/ports.json
PORTS_FILE="config/ports.json"
if [ ! -f "$PORTS_FILE" ]; then
    echo -e "${RED}❌ Error: $PORTS_FILE not found${NC}"
    exit 1
fi

# Function to get port from ports.json
# Use Python to handle paths with spaces properly
get_port() {
    local app_id=$1
    if command -v python3 &> /dev/null; then
        python3 -c "import json, os; config_path = os.path.join('$SCRIPT_DIR', '$PORTS_FILE'); config = json.load(open(config_path)); app = next((a for a in config['apps'] if a['id'] == '$app_id'), None); print(app['port'] if app else '')"
    elif command -v node &> /dev/null; then
        # Use JSON.parse with fs.readFileSync to handle paths with spaces
        node -e "const fs = require('fs'); const path = require('path'); const configPath = path.join('$SCRIPT_DIR', '$PORTS_FILE'); const config = JSON.parse(fs.readFileSync(configPath, 'utf8')); const app = config.apps.find(a => a.id === '$app_id'); console.log(app ? app.port : '');"
    else
        echo ""
    fi
}

# Get all ports
MIDDLEWARE_PORT=$(get_port "middleware")
HUB_PORT=$(get_port "hub")
MVP_BACKEND_PORT=$(get_port "mvpassistant-backend")
PERSONALAI_BACKEND_PORT=$(get_port "personalai-backend")
PERSONALAI_FRONTEND_PORT=$(get_port "personalai-frontend")
MVP_FRONTEND_PORT=$(get_port "mvpassistant-frontend")

# Validate ports
if [ -z "$MIDDLEWARE_PORT" ] || [ -z "$HUB_PORT" ] || [ -z "$MVP_BACKEND_PORT" ] || [ -z "$PERSONALAI_BACKEND_PORT" ] || [ -z "$PERSONALAI_FRONTEND_PORT" ] || [ -z "$MVP_FRONTEND_PORT" ]; then
    echo -e "${RED}❌ Error: Could not read ports from $PORTS_FILE${NC}"
    exit 1
fi

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to start service
start_service() {
    local name=$1
    local port=$2
    local start_cmd=$3
    local log_file=$4
    local pid_file=$5
    
    if check_port $port; then
        echo -e "${YELLOW}  ⚠️  $name is already running on port $port${NC}"
        return 0
    fi
    
    echo -e "${GREEN}  Starting $name on port $port...${NC}"
    eval "$start_cmd" > "$log_file" 2>&1 &
    local pid=$!
    echo $pid > "$pid_file"
    echo -e "${GREEN}  ✅ $name started (PID: $pid)${NC}"
    sleep 2
}

# 1. Start Middleware
echo -e "${BLUE}[1/6] Middleware${NC}"
if [ ! -d "middleware/node_modules" ]; then
    echo -e "${YELLOW}  Installing dependencies...${NC}"
    cd middleware && npm install --silent && cd ..
fi
start_service "Middleware" $MIDDLEWARE_PORT \
    "cd middleware && export PORT=$MIDDLEWARE_PORT && npm run dev" \
    "logs/middleware.log" \
    "logs/middleware.pid"

# 2. Start Central Hub
echo -e "${BLUE}[2/6] Central Hub${NC}"
if [ ! -d "hub/node_modules" ]; then
    echo -e "${YELLOW}  Installing dependencies...${NC}"
    cd hub && npm install --silent && cd ..
fi
start_service "Central Hub" $HUB_PORT \
    "cd hub && npm run dev" \
    "logs/hub.log" \
    "logs/hub.pid"

# 3. Start MVP Assistant Backend
echo -e "${BLUE}[3/6] MVP Assistant Backend${NC}"
if [ ! -d "apps/mvpassistant/backend/venv" ]; then
    echo -e "${RED}  ❌ Dependencies not installed. Run: cd apps/mvpassistant && ./INSTALL.sh${NC}"
else
    start_service "MVP Assistant Backend" $MVP_BACKEND_PORT \
        "cd apps/mvpassistant/backend && source venv/bin/activate && export PORT=$MVP_BACKEND_PORT && uvicorn main:app --host 0.0.0.0 --port $MVP_BACKEND_PORT" \
        "logs/mvpassistant-backend.log" \
        "logs/mvpassistant-backend.pid"
fi

# 4. Start PersonalAI Backend
echo -e "${BLUE}[4/6] PersonalAI Backend${NC}"
if [ ! -d "apps/personalai/backend/venv" ]; then
    echo -e "${RED}  ❌ Dependencies not installed. Run: cd apps/personalai && ./INSTALL.sh${NC}"
else
    start_service "PersonalAI Backend" $PERSONALAI_BACKEND_PORT \
        "cd apps/personalai/backend && source venv/bin/activate && export PORT=$PERSONALAI_BACKEND_PORT && export MIDDLEWARE_PORT=$MIDDLEWARE_PORT && uvicorn main:app --host 0.0.0.0 --port $PERSONALAI_BACKEND_PORT" \
        "logs/personalai-backend.log" \
        "logs/personalai-backend.pid"
fi

# 5. Start PersonalAI Frontend
echo -e "${BLUE}[5/6] PersonalAI Frontend${NC}"
if [ ! -d "apps/personalai/frontend/node_modules" ]; then
    echo -e "${YELLOW}  Installing dependencies...${NC}"
    cd apps/personalai/frontend && npm install --silent && cd ../../..
fi
start_service "PersonalAI Frontend" $PERSONALAI_FRONTEND_PORT \
    "cd apps/personalai/frontend && export PORT=$PERSONALAI_FRONTEND_PORT && npm run dev -- -p $PERSONALAI_FRONTEND_PORT -H 0.0.0.0" \
    "logs/personalai-frontend.log" \
    "logs/personalai-frontend.pid"

# 6. Start MVP Assistant Frontend
echo -e "${BLUE}[6/6] MVP Assistant Frontend${NC}"
if [ ! -d "apps/mvpassistant/frontend/node_modules" ]; then
    echo -e "${YELLOW}  Installing dependencies...${NC}"
    cd apps/mvpassistant/frontend && npm install --silent && cd ../../..
fi
start_service "MVP Assistant Frontend" $MVP_FRONTEND_PORT \
    "cd apps/mvpassistant/frontend && export PORT=$MVP_FRONTEND_PORT && npm run dev -- -p $MVP_FRONTEND_PORT -H 0.0.0.0" \
    "logs/mvpassistant-frontend.log" \
    "logs/mvpassistant-frontend.pid"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ All Services Started!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Access Points:${NC}"
echo "  🎛️  Central Hub:        http://localhost:$HUB_PORT"
echo "  🔌 Middleware API:      http://localhost:$MIDDLEWARE_PORT"
echo "  🤖 PersonalAI Backend:   http://localhost:$PERSONALAI_BACKEND_PORT"
echo "  🎨 PersonalAI Frontend: http://localhost:$PERSONALAI_FRONTEND_PORT"
echo "  🚀 MVP Assistant Backend:  http://localhost:$MVP_BACKEND_PORT"
echo "  💼 MVP Assistant Frontend: http://localhost:$MVP_FRONTEND_PORT"
echo ""
echo -e "${GREEN}Logs:${NC}"
echo "  - Middleware:              logs/middleware.log"
echo "  - Hub:                     logs/hub.log"
echo "  - PersonalAI Backend:      logs/personalai-backend.log"
echo "  - PersonalAI Frontend:     logs/personalai-frontend.log"
echo "  - MVP Assistant Backend:   logs/mvpassistant-backend.log"
echo "  - MVP Assistant Frontend:  logs/mvpassistant-frontend.log"
echo ""
echo -e "${YELLOW}To stop all services, run:${NC}"
echo "  ./stop.sh"
echo ""

# Wait a moment for hub to be ready, then open browser
echo -e "${BLUE}Waiting for Hub to be ready...${NC}"
MAX_WAIT=30
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if curl -s "http://localhost:$HUB_PORT" > /dev/null 2>&1; then
        echo -e "${GREEN}🌐 Opening Central Hub in your browser...${NC}"
        open "http://localhost:$HUB_PORT" 2>/dev/null || xdg-open "http://localhost:$HUB_PORT" 2>/dev/null || echo "Please manually open http://localhost:$HUB_PORT in your browser"
        break
    fi
    WAIT_COUNT=$((WAIT_COUNT + 1))
    sleep 1
done
if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
    echo -e "${YELLOW}⚠️  Hub may still be starting. Open http://localhost:$HUB_PORT when ready.${NC}"
fi
echo ""

