#!/bin/bash

# Chrome Extension Package Installer
# Installs all dependencies for the AssisantAI Chrome extension

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
EXTENSION_DIR="$PROJECT_ROOT/extension"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  AssisantAI Chrome Extension Installer${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if extension directory exists
if [ ! -d "$EXTENSION_DIR" ]; then
    echo -e "${RED}Error: Extension directory not found at $EXTENSION_DIR${NC}"
    exit 1
fi

# Check if package.json exists
if [ ! -f "$EXTENSION_DIR/package.json" ]; then
    echo -e "${RED}Error: package.json not found in extension directory${NC}"
    exit 1
fi

echo -e "${GREEN}Installing Chrome extension dependencies...${NC}"
echo -e "${YELLOW}Extension directory: $EXTENSION_DIR${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo -e "${YELLOW}Please install Node.js from https://nodejs.org/${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    echo -e "${YELLOW}Please install npm (comes with Node.js)${NC}"
    exit 1
fi

# Display Node.js and npm versions
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo -e "${GREEN}Node.js version: ${NODE_VERSION}${NC}"
echo -e "${GREEN}npm version: ${NPM_VERSION}${NC}"
echo ""

# Navigate to extension directory
cd "$EXTENSION_DIR"

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo -e "${YELLOW}node_modules directory exists. Cleaning...${NC}"
    rm -rf node_modules
    echo -e "${GREEN}Cleaned existing node_modules${NC}"
fi

# Check if package-lock.json exists
if [ -f "package-lock.json" ]; then
    echo -e "${YELLOW}Found package-lock.json, using locked versions${NC}"
fi

# Install dependencies
echo -e "${GREEN}Installing npm packages...${NC}"
echo ""

if npm install; then
    echo ""
    echo -e "${GREEN}✅ Dependencies installed successfully!${NC}"
    echo ""
    
    # Verify installation
    echo -e "${BLUE}Verifying installation...${NC}"
    
    # Check if key dependencies are installed
    MISSING_DEPS=0
    
    if [ ! -d "node_modules/react" ]; then
        echo -e "${RED}❌ React not found${NC}"
        MISSING_DEPS=1
    else
        echo -e "${GREEN}✅ React installed${NC}"
    fi
    
    if [ ! -d "node_modules/react-dom" ]; then
        echo -e "${RED}❌ React DOM not found${NC}"
        MISSING_DEPS=1
    else
        echo -e "${GREEN}✅ React DOM installed${NC}"
    fi
    
    if [ ! -d "node_modules/typescript" ]; then
        echo -e "${RED}❌ TypeScript not found${NC}"
        MISSING_DEPS=1
    else
        echo -e "${GREEN}✅ TypeScript installed${NC}"
    fi
    
    if [ ! -d "node_modules/esbuild" ]; then
        echo -e "${RED}❌ esbuild not found${NC}"
        MISSING_DEPS=1
    else
        echo -e "${GREEN}✅ esbuild installed${NC}"
    fi
    
    if [ ! -d "node_modules/@types/chrome" ]; then
        echo -e "${RED}❌ @types/chrome not found${NC}"
        MISSING_DEPS=1
    else
        echo -e "${GREEN}✅ @types/chrome installed${NC}"
    fi
    
    echo ""
    
    if [ $MISSING_DEPS -eq 0 ]; then
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  Installation Complete!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        echo -e "${BLUE}Next steps:${NC}"
        echo -e "  1. Run ${YELLOW}npm run build${NC} to build the extension"
        echo -e "  2. Load the extension in Chrome:"
        echo -e "     - Open ${YELLOW}chrome://extensions/${NC}"
        echo -e "     - Enable ${YELLOW}Developer mode${NC}"
        echo -e "     - Click ${YELLOW}Load unpacked${NC}"
        echo -e "     - Select the ${YELLOW}dist${NC} folder"
        echo ""
    else
        echo -e "${RED}⚠️  Some dependencies are missing. Please run ${YELLOW}npm install${NC} again.${NC}"
        exit 1
    fi
else
    echo ""
    echo -e "${RED}❌ Installation failed!${NC}"
    echo -e "${YELLOW}Please check the error messages above and try again.${NC}"
    exit 1
fi
