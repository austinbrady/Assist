#!/bin/bash

# AssisantAI - Complete Installation Script
# Installs 100% of all dependencies for all services

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Get project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# If running from Finder/double-click, open in Terminal
if [ -z "$TERM" ] || [ "$TERM" = "dumb" ]; then
    osascript <<EOF 2>/dev/null
tell application "Terminal"
    activate
    do script "cd '$SCRIPT_DIR' && bash '$SCRIPT_DIR/install.sh'"
end tell
EOF
    exit 0
fi

STEP=0
TOTAL_STEPS=12

print_step() {
    STEP=$((STEP + 1))
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}[$STEP/$TOTAL_STEPS] $1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check and install Homebrew
check_homebrew() {
    if ! command -v brew &> /dev/null; then
        print_warning "Homebrew not found. Installing automatically..."
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
        print_success "Homebrew installed"
    else
        print_success "Homebrew found"
    fi
}

# Function to check and install Python
check_python() {
    if ! command -v python3 &> /dev/null; then
        print_warning "Python 3 not found. Installing automatically..."
        brew install python3
        print_success "Python 3 installed"
    else
        PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
        PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
        PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
        
        if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 8 ]); then
            print_warning "Python version too old ($PYTHON_VERSION). Upgrading automatically..."
            brew upgrade python3
            print_success "Python 3 upgraded"
        else
            print_success "Python $PYTHON_VERSION found"
        fi
    fi
}

# Function to check and install Node.js
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_warning "Node.js not found. Installing automatically..."
        brew install node
        print_success "Node.js installed"
    else
        NODE_VERSION=$(node --version)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
        
        if [ "$NODE_MAJOR" -lt 18 ]; then
            print_warning "Node.js version too old ($NODE_VERSION). Upgrading automatically..."
            brew upgrade node
            print_success "Node.js upgraded"
        else
            print_success "Node.js $NODE_VERSION found"
        fi
    fi
    
    if ! command -v npm &> /dev/null; then
        print_warning "npm not found. Reinstalling Node.js..."
        brew reinstall node
        print_success "npm installed"
    else
        print_success "npm $(npm --version) found"
    fi
}

# Function to check and install Ollama
check_ollama() {
    if ! command -v ollama &> /dev/null; then
        print_warning "Ollama not found. Installing automatically..."
        brew install ollama
        print_success "Ollama installed"
    else
        print_success "Ollama found"
    fi
    
    # Check if Ollama is running, start if not
    if ! curl -s http://localhost:11434 > /dev/null 2>&1; then
        print_warning "Ollama is not running. Starting automatically..."
        ollama serve > /dev/null 2>&1 &
        sleep 5
        for i in {1..30}; do
            if curl -s http://localhost:11434 > /dev/null 2>&1; then
                print_success "Ollama started"
                break
            fi
            sleep 1
        done
    else
        print_success "Ollama is running"
    fi
    
    # Check for llama3 model, install if missing
    if ! ollama list 2>/dev/null | grep -q "llama3"; then
        print_warning "Ollama model 'llama3' not found. Installing automatically..."
        print_warning "This may take several minutes (downloading ~4GB)..."
        ollama pull llama3:latest
        print_success "llama3:latest installed"
    else
        print_success "Ollama model 'llama3' found"
    fi
}

# Main installation
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║         AssisantAI - Complete Bundle Installation      ║"
    echo "║                                                          ║"
    echo "║     Installing 100% of all dependencies for:            ║"
    echo "║     • AssistantAI Hub & Middleware                      ║"
    echo "║     • PersonalAI (Backend + Frontend)                  ║"
    echo "║     • MVP Assistant (Backend + Frontend)               ║"
    echo "║                                                          ║"
    echo "║     This is a complete bundle - everything is included!  ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    
    # Check macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_warning "This script is optimized for macOS. Some features may not work on other systems."
    fi
    
    # Step 1: System Dependencies
    print_step "Installing System Dependencies"
    check_homebrew
    check_python
    check_nodejs
    check_ollama
    
    # Step 2: Create necessary directories
    print_step "Creating Project Directories"
    mkdir -p logs
    mkdir -p config
    mkdir -p apps/personalai/backend/uploads
    mkdir -p apps/personalai/backend/chat_logs
    mkdir -p apps/personalai/backend/songs
    mkdir -p apps/personalai/backend/users
    mkdir -p apps/personalai/backend/avatars
    mkdir -p apps/mvpassistant/backend/users
    mkdir -p apps/mvpassistant/backend/users_data
    mkdir -p apps/mvpassistant/backend/chat_logs
    print_success "Directories created"
    
    # Step 3: Install root dependencies
    print_step "Installing Root Dependencies"
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "Root dependencies installed"
    else
        print_success "Root dependencies already installed"
    fi
    
    # Step 4: Install workspace packages
    print_step "Installing Workspace Packages"
    if npm run install:packages 2>/dev/null; then
        print_success "Workspace packages installed"
    else
        print_warning "Some package installations had issues, but continuing..."
    fi
    
    # Step 5: Build packages
    print_step "Building Packages"
    if npm run build 2>/dev/null; then
        print_success "Packages built"
    else
        print_warning "Some builds had issues, but continuing..."
    fi
    
    # Step 6: Install middleware dependencies
    print_step "Installing Middleware Dependencies"
    cd middleware
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "Middleware dependencies installed"
    else
        print_success "Middleware dependencies already installed"
    fi
    cd ..
    
    # Step 7: Install hub dependencies
    print_step "Installing Hub Dependencies"
    cd hub
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "Hub dependencies installed"
    else
        print_success "Hub dependencies already installed"
    fi
    cd ..
    
    # Step 8: Setup PersonalAI Backend (Child App)
    print_step "Installing PersonalAI Backend Dependencies (Child App)"
    cd apps/personalai/backend
    if [ ! -d "venv" ]; then
        print_warning "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    pip install --upgrade pip --quiet
    
    if pip install -r requirements.txt; then
        print_success "PersonalAI backend dependencies installed"
        
        # Generate avatars
        if [ -f "generate_avatars.py" ]; then
            print_warning "Generating AI assistant avatars..."
            python generate_avatars.py 2>/dev/null || print_warning "Avatar generation had issues, but continuing..."
        fi
    else
        print_error "Failed to install PersonalAI backend dependencies"
        exit 1
    fi
    deactivate
    cd ../../..
    
    # Step 9: Install PersonalAI Frontend (Child App)
    print_step "Installing PersonalAI Frontend Dependencies (Child App)"
    cd apps/personalai/frontend
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "PersonalAI frontend dependencies installed"
    else
        print_success "PersonalAI frontend dependencies already installed"
    fi
    cd ../../..
    
    # Step 10: Setup MVP Assistant Backend (Child App)
    print_step "Installing MVP Assistant Backend Dependencies (Child App)"
    cd apps/mvpassistant/backend
    if [ ! -d "venv" ]; then
        print_warning "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    pip install --upgrade pip --quiet
    
    if pip install -r requirements.txt; then
        print_success "MVP Assistant backend dependencies installed"
    else
        print_error "Failed to install MVP Assistant backend dependencies"
        exit 1
    fi
    deactivate
    cd ../../..
    
    # Step 11: Install MVP Assistant Frontend (Child App)
    print_step "Installing MVP Assistant Frontend Dependencies (Child App)"
    cd apps/mvpassistant/frontend
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "MVP Assistant frontend dependencies installed"
    else
        print_success "MVP Assistant frontend dependencies already installed"
    fi
    cd ../../..
    
    # Step 12: Verify all dependencies
    print_step "Verifying All Dependencies"
    MISSING=0
    
    if [ ! -d "node_modules" ]; then
        print_error "Root node_modules missing"
        MISSING=$((MISSING + 1))
    else
        print_success "Root dependencies ✓"
    fi
    
    if [ ! -d "middleware/node_modules" ]; then
        print_error "Middleware node_modules missing"
        MISSING=$((MISSING + 1))
    else
        print_success "Middleware dependencies ✓"
    fi
    
    if [ ! -d "hub/node_modules" ]; then
        print_error "Hub node_modules missing"
        MISSING=$((MISSING + 1))
    else
        print_success "Hub dependencies ✓"
    fi
    
    if [ ! -d "apps/personalai/backend/venv" ]; then
        print_error "PersonalAI backend venv missing"
        MISSING=$((MISSING + 1))
    else
        print_success "PersonalAI backend dependencies ✓"
    fi
    
    if [ ! -d "apps/personalai/frontend/node_modules" ]; then
        print_error "PersonalAI frontend node_modules missing"
        MISSING=$((MISSING + 1))
    else
        print_success "PersonalAI frontend dependencies ✓"
    fi
    
    if [ ! -d "apps/mvpassistant/backend/venv" ]; then
        print_error "MVP Assistant backend venv missing"
        MISSING=$((MISSING + 1))
    else
        print_success "MVP Assistant backend dependencies ✓"
    fi
    
    if [ ! -d "apps/mvpassistant/frontend/node_modules" ]; then
        print_error "MVP Assistant frontend node_modules missing"
        MISSING=$((MISSING + 1))
    else
        print_success "MVP Assistant frontend dependencies ✓"
    fi
    
    if [ $MISSING -eq 0 ]; then
        print_success "All dependencies installed successfully!"
    else
        print_error "$MISSING components are missing. Please run this script again."
        exit 1
    fi
    
    # Make scripts executable
    chmod +x start.sh stop.sh 2>/dev/null || true
    chmod +x apps/personalai/START.sh 2>/dev/null || true
    chmod +x apps/mvpassistant/START.sh 2>/dev/null || true
    
    # Final summary
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                                          ║${NC}"
    echo -e "${GREEN}║         ✅ Installation Complete!                        ║${NC}"
    echo -e "${BLUE}║                                                          ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo ""
    echo -e "${YELLOW}1. Start all services:${NC}"
    echo "   ./start.sh"
    echo ""
    echo -e "${YELLOW}2. Access the Central Hub:${NC}"
    echo "   http://localhost:4200"
    echo ""
    echo -e "${YELLOW}3. Access PersonalAI:${NC}"
    echo "   Frontend: http://localhost:4203"
    echo "   Backend:  http://localhost:4202"
    echo ""
    echo -e "${YELLOW}4. Access MVP Assistant:${NC}"
    echo "   Frontend: http://localhost:4204"
    echo "   Backend:  http://localhost:4201"
    echo ""
    echo -e "${YELLOW}5. Stop all services:${NC}"
    echo "   ./stop.sh"
    echo ""
    echo -e "${GREEN}🎉 Everything is ready! All dependencies are installed!${NC}"
    echo ""
}

# Run main function
main

