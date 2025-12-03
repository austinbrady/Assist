#!/bin/bash

# ============================================================
# MVP Assistant - Installation Script
# ============================================================
# This script installs all prerequisites and dependencies
# Run this once before using START.sh
# ============================================================

set +e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# If running from Finder/double-click, open in Terminal
if [ -z "$TERM" ] || [ "$TERM" = "dumb" ]; then
    osascript <<EOF 2>/dev/null
tell application "Terminal"
    activate
    do script "cd '$SCRIPT_DIR' && bash '$SCRIPT_DIR/INSTALL.sh'"
end tell
EOF
    exit 0
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Function to check and install Homebrew
check_homebrew() {
    if ! command -v brew &> /dev/null; then
        echo -e "${YELLOW}Homebrew not found. Installing automatically...${NC}"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if [ -f "/opt/homebrew/bin/brew" ]; then
                eval "$(/opt/homebrew/bin/brew shellenv)"
                echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
            elif [ -f "/usr/local/bin/brew" ]; then
                eval "$(/usr/local/bin/brew shellenv)"
                echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
            fi
        fi
        echo -e "${GREEN}✅ Homebrew installed${NC}"
    else
        echo -e "${GREEN}✅ Homebrew found${NC}"
    fi
}

# Function to check and install Python
check_python() {
    if ! command -v python3 &> /dev/null; then
        echo -e "${YELLOW}Python 3 not found. Installing automatically...${NC}"
        brew install python3
        echo -e "${GREEN}✅ Python 3 installed${NC}"
    else
        PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
        PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
        PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
        
        if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 8 ]); then
            echo -e "${YELLOW}Python version too old ($PYTHON_VERSION). Upgrading automatically...${NC}"
            brew upgrade python3
            echo -e "${GREEN}✅ Python 3 upgraded${NC}"
        else
            echo -e "${GREEN}✅ Python $PYTHON_VERSION found${NC}"
        fi
    fi
}

# Function to check and install Node.js
check_nodejs() {
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}Node.js not found. Installing automatically...${NC}"
        brew install node
        echo -e "${GREEN}✅ Node.js installed${NC}"
    else
        NODE_VERSION=$(node --version)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
        
        if [ "$NODE_MAJOR" -lt 16 ]; then
            echo -e "${YELLOW}Node.js version too old ($NODE_VERSION). Upgrading automatically...${NC}"
            brew upgrade node
            echo -e "${GREEN}✅ Node.js upgraded${NC}"
        else
            echo -e "${GREEN}✅ Node.js $NODE_VERSION found${NC}"
        fi
    fi
}

# Function to check and install Ollama
check_ollama() {
    if ! command -v ollama &> /dev/null; then
        echo -e "${YELLOW}Ollama not found. Installing automatically...${NC}"
        brew install ollama
        echo -e "${GREEN}✅ Ollama installed${NC}"
    else
        echo -e "${GREEN}✅ Ollama found${NC}"
    fi
    
    # Check if Ollama is running, start if not
    if ! curl -s http://localhost:11434 > /dev/null 2>&1; then
        echo -e "${YELLOW}Ollama is not running. Starting automatically...${NC}"
        ollama serve > /dev/null 2>&1 &
        sleep 5
        for i in {1..30}; do
            if curl -s http://localhost:11434 > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Ollama started${NC}"
                break
            fi
            sleep 1
        done
    else
        echo -e "${GREEN}✅ Ollama is running${NC}"
    fi
    
    # Check for llama3 model, install if missing
    if ! ollama list 2>/dev/null | grep -q "llama3"; then
        echo -e "${YELLOW}Ollama model 'llama3' not found. Installing automatically...${NC}"
        echo -e "${YELLOW}This may take several minutes (downloading ~4GB)...${NC}"
        ollama pull llama3:latest
        echo -e "${GREEN}✅ llama3:latest installed${NC}"
    else
        echo -e "${GREEN}✅ Ollama model 'llama3' found${NC}"
    fi
}

# Function to install dependencies
install_dependencies() {
    echo -e "${YELLOW}Installing application dependencies...${NC}"
    echo ""
    
    # Create necessary directories
    echo -e "${YELLOW}Creating necessary directories...${NC}"
    mkdir -p "$SCRIPT_DIR/backend/users"
    mkdir -p "$SCRIPT_DIR/backend/users_data"
    mkdir -p "$SCRIPT_DIR/backend/chat_logs"
    mkdir -p "$SCRIPT_DIR/logs"
    echo -e "${GREEN}✅ Directories created${NC}"
    
    # Setup Python environment
    if [ ! -d "backend/venv" ]; then
        echo -e "${YELLOW}Creating Python virtual environment...${NC}"
        cd "$SCRIPT_DIR/backend"
        python3 -m venv venv
        cd "$SCRIPT_DIR"
    fi
    
    echo -e "${YELLOW}Installing Python dependencies (this may take a few minutes)...${NC}"
    cd "$SCRIPT_DIR/backend"
    source venv/bin/activate
    
    pip install --upgrade pip --quiet
    
    if pip install -r requirements.txt; then
        echo -e "${GREEN}✅ Python dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install Python dependencies${NC}"
        exit 1
    fi
    cd "$SCRIPT_DIR"
    
    # Setup Node.js environment
    if [ ! -d "frontend/node_modules" ]; then
        echo -e "${YELLOW}Installing Node.js dependencies (this may take several minutes)...${NC}"
        cd "$SCRIPT_DIR/frontend"
        if npm install; then
            echo -e "${GREEN}✅ Node.js dependencies installed${NC}"
        else
            echo -e "${RED}❌ Failed to install Node.js dependencies${NC}"
            exit 1
        fi
        cd "$SCRIPT_DIR"
    else
        echo -e "${GREEN}✅ Node.js dependencies already installed${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✅ All dependencies installed successfully!${NC}"
    echo ""
}

# Main execution
main() {
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}  MVP Assistant - Installation${NC}"
    echo -e "${BLUE}============================================================${NC}"
    echo ""
    
    if [[ "$OSTYPE" != "darwin"* ]]; then
        echo -e "${YELLOW}⚠️  This script is optimized for macOS. Some features may not work on other systems.${NC}"
    fi
    
    check_homebrew
    echo ""
    
    check_python
    echo ""
    
    check_nodejs
    echo ""
    
    check_ollama
    echo ""
    
    install_dependencies
    
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${GREEN}✅ Installation Complete!${NC}"
    echo -e "${BLUE}============================================================${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Run ./START.sh to launch the application"
    echo "  2. Access MVP Assistant at http://localhost:7777"
    echo ""
    echo -e "${GREEN}🎉 Installation complete! You're ready to use MVP Assistant.${NC}"
    echo ""
}

main

