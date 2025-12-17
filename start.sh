#!/bin/bash

# ============================================================
# Personal AI - Server Runner
# ============================================================
# This script launches the GUI application
# Make sure to run INSTALL.sh first
# ============================================================

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# If running from Finder/double-click, open in Terminal
if [ -z "$TERM" ] || [ "$TERM" = "dumb" ]; then
    # Open this script in Terminal
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

# Activate virtual environment
cd "$SCRIPT_DIR"
source backend/venv/bin/activate

# Set environment variable to bypass macOS version check issues
export TK_SILENCE_DEPRECATION=1

# Test if tkinter works before trying to launch GUI
echo "Checking GUI compatibility..."
if python3 -c "import tkinter; tk = tkinter.Tk(); tk.destroy()" 2>&1 | grep -q "macOS.*required"; then
    echo "⚠️  GUI launcher has compatibility issues on this system."
    echo "Using CLI launcher instead..."
    echo ""
    python3 launch_cli.py &
    LAUNCHER_PID=$!
elif python3 -c "import tkinter; tk = tkinter.Tk(); tk.destroy()" 2>/dev/null; then
    # tkinter works, try GUI
    echo "Launching GUI..."
    python3 launch.py &
    LAUNCHER_PID=$!
else
    # tkinter test failed for other reasons, use CLI
    echo "⚠️  GUI not available. Using CLI launcher..."
    echo ""
    python3 launch_cli.py &
    LAUNCHER_PID=$!
fi

# Wait for servers to start, then open browser
echo ""
echo "⏳ Waiting for servers to start (this may take 15-20 seconds)..."
sleep 20

# Check if frontend is ready before opening browser
MAX_RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:7777 > /dev/null 2>&1; then
        echo "✅ Frontend server is ready!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   Waiting for frontend... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

# Open browser to localhost:7777
echo "🌐 Opening Personal AI in your browser..."
open http://localhost:7777/ 2>/dev/null || xdg-open http://localhost:7777/ 2>/dev/null || echo "Please manually open http://localhost:7777/ in your browser"

