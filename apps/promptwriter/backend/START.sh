#!/bin/bash

# Prompt Writer Backend Startup Script

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Configuration
PORT=${PROMPTWRITER_BACKEND_PORT:-4206}
LOG_FILE="../logs/backend.log"
PID_FILE="../logs/backend.pid"

echo -e "${BLUE}Starting Prompt Writer Backend on port $PORT...${NC}"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/.dependencies_installed" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pip install -q -r requirements.txt
    touch venv/.dependencies_installed
fi

# Create logs directory
mkdir -p ../logs

# Check if port is already in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port $PORT is already in use${NC}"
    exit 1
fi

# Start the server
echo -e "${GREEN}✅ Starting Prompt Writer Backend...${NC}"
nohup uvicorn main:app --host 0.0.0.0 --port $PORT > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

echo -e "${GREEN}✅ Prompt Writer Backend started (PID: $(cat $PID_FILE))${NC}"
echo -e "${BLUE}   Logs: $LOG_FILE${NC}"
echo -e "${BLUE}   API: http://localhost:$PORT${NC}"

