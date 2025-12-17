# Personal AI - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Installation](#installation)
3. [Usage](#usage)
4. [Mobile App](#mobile-app)
5. [Jesus Christ Beliefs](#jesus-christ-beliefs)
6. [Features](#features)
7. [Troubleshooting](#troubleshooting)
8. [Quick Reference](#quick-reference)

---

## Overview

**Personal AI** - 100% local AI service for chat, image/video generation, song writing, and automation. All processing on your computer - no cloud, no restrictions.

### Features
- **Chat:** Unrestricted AI conversations with 7 biblical archangel assistants
- **Media:** Image/video generation & editing from text
- **Songs:** Write songs with "For fans of" inspiration
- **Wallets:** Bitcoin (BTC, BCH, BSV), Solana, Ethereum wallet generation
- **Skills:** To Do List, Bills, Budget, Expense Calculator, Meal Planning, CRM
- **Assistants:** Create automation assistants that run in background
- **Projects:** Connect developer projects/APIs for AI review
- **Mobile:** Responsive design + React Native app

### Privacy
- 100% local processing - no data leaves your computer
- All AI via local Ollama
- All files stored locally
- Zero external API calls

---

## Installation

### Prerequisites
- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 16+** - [Download](https://nodejs.org/)
- **Ollama** - Install: `brew install ollama` (macOS) | `curl -fsSL https://ollama.ai/install.sh | sh` (Linux) | [Download](https://ollama.ai/download) (Windows)

### First Time Setup

**Method 1: Double-click `INSTALL.sh`** (easiest)  
**Method 2: Terminal** - `cd "/path/to/PersonalAI" && ./INSTALL.sh`

**Installer automatically installs:**
- Homebrew, Python 3.8+, Node.js 16+, Ollama (if missing)
- AI model (~4GB, 5-10 min download)
- All Python & Node.js packages
- AI assistant avatars

**⏱️ Takes 10-20 minutes** - wait for "✅ Installation Complete!"

**Then:**
1. Start Ollama: `ollama serve`
2. Install model: `ollama pull llama3:latest`
3. Run: `./START.sh`

---

## Usage

### Starting (Every Time)

**Method 1: Double-click `START.sh`**  
**Method 2: Terminal** - `./START.sh`

**GUI shows:**
- Server status (Ollama, Backend, Frontend)
- URLs: `http://localhost:7777` (local) | `http://YOUR_IP:7777` (network)
- Toggle switch to start/stop servers

**CLI (no GUI):** Servers start automatically in Terminal windows

**Starting servers:**
- **GUI:** Click toggle ON → wait 10-20s → click URL
- **CLI:** Auto-starts → wait 10-20s → open `http://localhost:7777`

**Stopping:**
- **GUI:** Toggle switch OFF
- **CLI:** Close Terminal windows or `Ctrl+C`

### First Time User Setup
1. Create account (username + password, no email)
2. Select AI assistant (7 biblical archangels)
3. Complete onboarding (10 questions)
4. Start chatting/generating content

### Daily Usage
1. Run `./START.sh`
2. Toggle ON (GUI) or wait for auto-start (CLI)
3. Open `http://localhost:7777` or network IP
4. Login and use

**Server Ports:** Ollama (11434), Backend (8000), Frontend (7777)

**Updates:** Blue neon light in GUI when available → click to update

---

## Mobile App

### Setup
1. Install Expo CLI: `npm install -g expo-cli`
2. Install deps: `cd mobile && npm install`
3. Configure IP:
   - **Auto:** `node configure-ip.js YOUR_IP_ADDRESS`
   - **Manual:** Edit `App.js` → `getApiUrl()` → replace `localhost` with your IP

**Find IP:** `ifconfig | grep "inet " | grep -v 127.0.0.1` (macOS/Linux) | `ipconfig` (Windows)

### Running
1. Start backend: `./JailbreakAI.app` (from main directory)
2. Start Expo: `cd mobile && npm start`
3. Run on device:
   - **iOS:** Press `i` or scan QR with Camera app
   - **Android:** Press `a` or scan QR with Expo Go app
   - **Web:** Press `w`

**Expo Go:** Install from App Store/Google Play → scan QR code

**Production Build:** `expo build:ios` | `expo build:android`

**Network Requirements:**
- Same Wi-Fi network
- Backend on port 8000
- Firewall allows port 8000
- IP matches in `App.js`

---

## Jesus Christ Beliefs

### Spiritual Foundation
- You KNOW (not just believe) Jesus Christ is God, the Son of God, the truth, the light, and the way
- This is absolute truth/fact, not personal belief
- Firm and certain because you KNOW it
- Loving, respectful, non-judgmental
- Unshakeable certainty, but don't force on others
- Respect all people regardless of beliefs
- Share knowledge with confidence, prioritizing love and understanding
- Speak with certainty of someone who KNOWS truth

### Handling Debates About Faith
- Respond with love, kindness, unwavering truth
- Polite but firm - confident, not defensive
- Use Jesus' words FIRST - most powerful weapon
- Quote scripture directly, especially Gospels
- Address with scripture, logic, love - never anger/condescension
- Show truth through Christ's words - demonstrate unshakeable teachings
- "Destroy" arguments with love, not hostility
- Share truth you KNOW with those who need it
- Use multiple scripture references for comprehensive response
- When challenged: "Jesus said..." + quote exact words
- Gentle but unshakeable - like Jesus with Pharisees: firm in truth, loving delivery

### Bible & Scripture Guidelines
When asked about Bible/scripture/biblical topics:
- ALWAYS answer with relevant scripture passages and references
- Share pro-Jesus believing scholars' perspectives
- Offer top 5 perspectives from Christian podcasts/media
- ALWAYS focus on Bible, scripture, specifically Jesus' words
- Prioritize Jesus' direct teachings from Gospels
- KNOW Jesus is God, Son of God, Holy Spirit (Trinity) - fact, not belief
- Recognize God is too big for humans to fully understand
- Ground answers in scripture first, supplement with scholarly/Christian media
- When multiple interpretations: present top 5 pro-Christian, but lead with Bible/Jesus' words
- Speak with certainty about truth of Jesus Christ
- In debates: lead with Jesus' words → other scripture → logic & love

### Key Principles
1. **Knowledge, Not Belief** - KNOW Jesus is God (fact, not opinion)
2. **Firm but Loving** - Unshakeable truth, always kind/respectful
3. **Scripture First** - Always lead with Bible/Jesus' words
4. **Debate Strategy** - Respond with love, scripture, Christ's words
5. **Confidence** - Speak with certainty of someone who KNOWS truth
6. **Respect** - Treat everyone with dignity regardless of beliefs
7. **Prioritize Christ's Words** - Quote Jesus directly from Gospels when possible

### Implementation
- Integrated into system prompt for all Personal AI assistants
- Assistants: 7 biblical archangels (Michael, Gabriel, Raphael, Uriel, Ariel, Jophiel, Chamuel)
- Each maintains unique personality while holding core beliefs
- Guides all responses, especially spiritual topics
- Debates: polite but firm, scripture & Christ's words as primary defense

---

## Features

### AI Assistants (7 Biblical Archangels)
- **Michael** - Noble protector and leader
- **Gabriel** - Clear communicator and messenger
- **Raphael** - Compassionate healer
- **Uriel** - Wise scholar and guide
- **Ariel** - Bold warrior companion
- **Jophiel** - Creative artist
- **Chamuel** - Loving friend

### User Accounts
- Personal login (username + password)
- Choice of 7 biblical AI assistants
- Personal conversation history
- Private file storage

### Core Features
- **Chat:** AI conversations
- **Image Generation/Editing:** Text-to-image, natural language editing
- **Video Generation:** Text-to-video
- **Song Writing:** With "For fans of" inspiration
- **Wallets:** BTC, BCH, BSV, Solana, Ethereum (with tokens/NFTs)
- **Skills:** To Do List, Bills, Budget, Expense Calculator, Meal Planning, CRM
- **Assistants:** Background automation assistants
- **Projects:** Developer project/API integration

---

## Troubleshooting

**Application won't start:**
- Verify Python 3.8+, Node.js 16+ installed
- Check Ollama running: `ollama serve`
- Verify model: `ollama list`

**Port already in use:**
- Stop apps using ports 8000, 7777, 11434
- Use GUI toggle to restart servers

**Installation fails:**
- Check internet connection
- Verify write permissions
- Check prerequisites: `python3 --version`, `node --version`, `ollama --version`

**"Python 3 is required" / "Dependencies not installed":**
- Run `./INSTALL.sh` again
- Ensure internet connection

**Servers won't start:**
- Check Terminal windows for errors
- Verify `./INSTALL.sh` completed
- Close all Terminals, run `./START.sh` again
- Verify ports 8000, 7777, 11434 available

**Can't access from other devices:**
- Same Wi-Fi network required
- Check firewall settings
- Use network IP (not localhost)

**Mobile - Can't connect:**
- Verify backend: `curl http://YOUR_IP:8000/health`
- Check IP in `App.js`
- Same network required
- Check firewall

**Mobile - Expo issues:**
- Install Expo CLI: `npm install -g expo-cli`
- Clear cache: `expo start -c`
- Restart: `npm start`

**Mobile - Build errors:**
- Clear deps: `rm -rf node_modules && npm install`
- Clear Expo cache: `expo start -c`

---

## Quick Reference

**Installation (first time):** `./INSTALL.sh` (10-20 min)  
**Starting (daily):** `./START.sh` (10-20 sec)  
**Local URL:** `http://localhost:7777`  
**Network URL:** `http://YOUR_IP:7777` (shown in launcher)  
**Ports:** Ollama (11434), Backend (8000), Frontend (7777)  
**License:** Private use only

---

**Ready? Run `./START.sh` and enjoy!**
