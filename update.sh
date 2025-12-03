#!/bin/bash

# AssistantAI Auto-Update Script
# Automatically checks for and downloads updates when the app starts

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}🔄 Checking for updates...${NC}"

# Check if git is available
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}⚠️  Git not found. Skipping update check.${NC}"
    exit 0
fi

# Check if this is a git repository
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Not a git repository. Skipping update check.${NC}"
    exit 0
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")

# Fetch latest changes (don't merge yet)
echo -e "${BLUE}📥 Fetching latest changes from remote...${NC}"
git fetch origin "$CURRENT_BRANCH" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Could not fetch updates. Continuing anyway.${NC}"
    exit 0
}

# Check if there are updates
LOCAL_COMMIT=$(git rev-parse HEAD 2>/dev/null)
REMOTE_COMMIT=$(git rev-parse "origin/$CURRENT_BRANCH" 2>/dev/null || echo "$LOCAL_COMMIT")

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
    echo -e "${GREEN}✅ You're up to date!${NC}"
    exit 0
fi

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes. Stashing them before update...${NC}"
    git stash push -m "Auto-stash before update $(date +%Y-%m-%d_%H-%M-%S)" 2>/dev/null || {
        echo -e "${RED}❌ Could not stash changes. Please commit or stash manually.${NC}"
        exit 1
    }
    STASHED=true
else
    STASHED=false
fi

# Pull latest changes
echo -e "${BLUE}⬇️  Downloading updates...${NC}"
if git pull origin "$CURRENT_BRANCH" 2>/dev/null; then
    echo -e "${GREEN}✅ Successfully updated!${NC}"
    
    # Show what changed
    echo -e "${BLUE}📋 Recent changes:${NC}"
    git log --oneline "$LOCAL_COMMIT..HEAD" 2>/dev/null | head -5 || true
    
    # Restore stashed changes if any
    if [ "$STASHED" = true ]; then
        echo -e "${BLUE}🔄 Restoring your changes...${NC}"
        git stash pop 2>/dev/null || {
            echo -e "${YELLOW}⚠️  Could not automatically restore changes. Run 'git stash pop' manually.${NC}"
        }
    fi
    
    # Check if dependencies need updating
    echo -e "${BLUE}🔍 Checking for dependency updates...${NC}"
    
    # Check package.json files
    if [ -f "package.json" ]; then
        echo -e "${BLUE}📦 Root package.json found${NC}"
    fi
    
    if [ -f "hub/package.json" ]; then
        echo -e "${BLUE}📦 Hub package.json found${NC}"
    fi
    
    if [ -f "middleware/package.json" ]; then
        echo -e "${BLUE}📦 Middleware package.json found${NC}"
    fi
    
    # Check Python requirements
    if [ -f "apps/personalai/backend/requirements.txt" ]; then
        echo -e "${BLUE}🐍 Python requirements.txt found${NC}"
    fi
    
    echo -e "${GREEN}✅ Update check complete!${NC}"
    echo -e "${YELLOW}💡 Tip: Run './install.sh' if you need to update dependencies.${NC}"
    
else
    echo -e "${RED}❌ Failed to update. Please update manually.${NC}"
    
    # Restore stashed changes on failure
    if [ "$STASHED" = true ]; then
        echo -e "${BLUE}🔄 Restoring your changes...${NC}"
        git stash pop 2>/dev/null || true
    fi
    
    exit 1
fi

