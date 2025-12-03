#!/bin/bash

# AssisantAI - Unified Stop Script
# Stops all services by reading ports from config/ports.json

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}🛑 Stopping AssisantAI${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

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

# Function to stop service by PID file
stop_by_pid() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 $pid 2>/dev/null; then
            kill $pid 2>/dev/null || true
            echo -e "${GREEN}  ✅ Stopped $service_name (PID: $pid)${NC}"
        else
            echo -e "${YELLOW}  ⚠️  $service_name process not found${NC}"
        fi
        rm -f "$pid_file"
    fi
}

# Function to stop service by port
stop_by_port() {
    local port=$1
    local service_name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        kill $(lsof -t -i:$port) 2>/dev/null || true
        echo -e "${GREEN}  ✅ Stopped $service_name on port $port${NC}"
    fi
}

# Stop services in reverse order
echo -e "${YELLOW}[1/6] MVP Assistant Frontend...${NC}"
stop_by_pid "logs/mvpassistant-frontend.pid" "MVP Assistant Frontend"
stop_by_port $MVP_FRONTEND_PORT "MVP Assistant Frontend"

echo -e "${YELLOW}[2/6] PersonalAI Frontend...${NC}"
stop_by_pid "logs/personalai-frontend.pid" "PersonalAI Frontend"
stop_by_port $PERSONALAI_FRONTEND_PORT "PersonalAI Frontend"

echo -e "${YELLOW}[3/6] PersonalAI Backend...${NC}"
stop_by_pid "logs/personalai-backend.pid" "PersonalAI Backend"
stop_by_port $PERSONALAI_BACKEND_PORT "PersonalAI Backend"

echo -e "${YELLOW}[4/6] MVP Assistant Backend...${NC}"
stop_by_pid "logs/mvpassistant-backend.pid" "MVP Assistant Backend"
stop_by_port $MVP_BACKEND_PORT "MVP Assistant Backend"

echo -e "${YELLOW}[5/6] Central Hub...${NC}"
stop_by_pid "logs/hub.pid" "Central Hub"
stop_by_port $HUB_PORT "Central Hub"

echo -e "${YELLOW}[6/6] Middleware...${NC}"
stop_by_pid "logs/middleware.pid" "Middleware"
stop_by_port $MIDDLEWARE_PORT "Middleware"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ All Services Stopped${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

