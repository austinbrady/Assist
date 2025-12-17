<<<<<<< HEAD
# AssisantAI - Master Hub

**Your Personal "MegaMan" AI Assistant** - A master hub for all Niche AI Assistants that run locally on your computer. Think of it like MegaMan from the cartoon with LAN - your personal AI assistant who lives in your devices, knows you intimately, and can jump between specialized applications while maintaining the same personality, memory, and understanding of your goals.

> **Read the [Vision Document](VISION.md) to understand the full philosophy and goals of AssisantAI.**

Unified AI Assistant Infrastructure - A master project that connects all AI assistant applications under a single agent infrastructure, ensuring users have the same account, agent, and information across all apps.

## Architecture

```
AssisantAI/
├── apps/                    # Child AI assistant applications
│   ├── personalai/         # PersonalAI (Backend + Frontend)
│   └── mvpassistant/       # MVP Assistant (Backend + Frontend)
├── packages/               # Shared packages
│   ├── auth/               # Unified authentication
│   ├── agent/              # Shared agent infrastructure
│   └── port-manager/       # Port management system
├── hub/                     # Central hub dashboard (port 4200)
├── middleware/              # API middleware connecting all apps (port 4199)
├── config/                  # Configuration files (ports, apps)
├── install.sh               # Complete installation script
├── start.sh                 # Start all services
└── stop.sh                  # Stop all services
```

## Features

- **Unified Authentication**: Single sign-on across all apps
- **Shared Agent**: Same AI agent personality and memory across apps
- **Full Conversation History**: Every message automatically includes complete conversation history for context
- **Organic Learning System**: Learns about users naturally through conversation to provide better service
- **Cross-App Data**: User data and conversation history shared
- **Central Hub Dashboard**: Visual interface to manage all apps (port 4200)
- **Automatic Port Management**: Apps automatically assigned ports (4199, 4200, 4201, 4202...)
- **Middleware Layer**: Connects all apps to shared backend (port 4199)
- **Complete Bundle**: Everything included - just download, install, and run

## Quick Start

### Installation

**One command installs everything:**

```bash
./install.sh
```

This single command will:
- ✅ Install all system dependencies (Homebrew, Python, Node.js, Ollama)
- ✅ Download and install the AI model (llama3:latest)
- ✅ Install all project dependencies (root, packages, middleware, hub)
- ✅ Install PersonalAI (Backend + Frontend)
- ✅ Install MVP Assistant (Backend + Frontend)
- ✅ Create all configuration files
- ✅ Build all packages
- ✅ Verify all dependencies are installed

**⏱️ Takes 15-30 minutes** (mostly downloading packages and the AI model)

### Starting the Application

**Start all services:**

```bash
./start.sh
```

This starts:
- Middleware (port 4199)
- Central Hub (port 4200)
- MVP Assistant Backend (port 4201)
- PersonalAI Backend (port 4202)
- PersonalAI Frontend (port 4203)
- MVP Assistant Frontend (port 4204)

### Access Points

After starting, access:

- **🎛️ Central Hub**: http://localhost:4200
- **🔌 Middleware API**: http://localhost:4199
- **🤖 PersonalAI Backend**: http://localhost:4202
- **🎨 PersonalAI Frontend**: http://localhost:4203
- **🚀 MVP Assistant Backend**: http://localhost:4201
- **💼 MVP Assistant Frontend**: http://localhost:4204

### Stopping Services

**Stop all services:**

```bash
./stop.sh
```

## Port Assignment

Ports are automatically assigned and managed:
- **4199**: Middleware (API gateway)
- **4200**: Central Hub (dashboard)
- **4201**: MVP Assistant Backend
- **4202**: PersonalAI Backend
- **4203**: PersonalAI Frontend
- **4204**: MVP Assistant Frontend

See [Port Management Guide](docs/PORT_MANAGEMENT.md) for details.

## Child Apps

This bundle includes two child applications that are automatically installed:

### PersonalAI
- **Backend**: Port 4202 - Comprehensive local AI assistant with chat, image/video generation, song writing, and 20+ automation skills
- **Frontend**: Port 4203 - Web interface for PersonalAI
- **Description**: Serves as the base backend for AssistantAI ecosystem, providing authentication, agent infrastructure, and core services

### MVP Assistant
- **Backend**: Port 4201 - Dynamically generates custom GUI applications to solve user problems
- **Frontend**: Port 4204 - Web interface for MVP Assistant
- **Description**: Problem-driven app generator that creates complete applications on-demand

## Niche Assistants

AssisantAI is designed to host many specialized AI assistants, each an expert in their domain. See [Niche Assistants Guide](docs/NICHE_ASSISTANTS.md) for the full list.

**Planned Assistants Include**:
- 🎨 **3D Printing Assistant**: English-to-CAD-to-STL converter
- 🎨 **Logo Designer**: AI-powered logo creation
- 🎵 **Song Creator**: Enhanced music generation
- 💻 **Code Assistant**: Project-aware coding help
- ✍️ **Writing Assistant**: Style-consistent content creation
- 🍳 **Recipe Assistant**: Personalized meal planning
- 💪 **Fitness Assistant**: Goal-tracking workouts
- 💰 **Finance Assistant**: Budget and goal management
- 📚 **Learning Assistant**: Personalized education
- And many more...

**The Magic**: All assistants share the same agent personality and knowledge, so your assistant remembers everything across all apps.

## Development

### Project Structure

- `apps/` - Child applications (PersonalAI, MVP Assistant)
- `packages/` - Shared TypeScript packages
- `hub/` - Central dashboard (Next.js)
- `middleware/` - API middleware (Express/TypeScript)
- `config/` - Configuration files (ports.json, apps.json)

### Adding New Apps

1. Create app directory in `apps/`
2. Add app configuration to `config/apps.json`
3. Ports are automatically assigned via `config/ports.json`
4. Run `./install.sh` to install dependencies
5. App will be available via `./start.sh`

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System architecture and design
- [Port Management](docs/PORT_MANAGEMENT.md) - How ports are assigned
- [Integration Guide](docs/INTEGRATION_GUIDE.md) - How to integrate apps
- [Vision](VISION.md) - Project vision and philosophy

## Repository

This project is hosted at: https://github.com/austinbrady/Assist

## License

See [LICENSE](LICENSE) file for details.
=======
# Personal AI

A completely local AI service for chat, image generation, video processing, and song writing. Everything runs on your computer - no cloud, no restrictions.

## 🚀 Quick Start

**First time setup:**

1. **Run the installer:**
   ```bash
   ./INSTALL.sh
   ```
   This will install all prerequisites (Python, Node.js, Ollama) and dependencies.

2. **Start the application:**
   ```bash
   ./START.sh
   ```

The application will:
- ✅ Open a GUI window with toggle switch
- ✅ Display localhost and network IP addresses
- ✅ Start backend server (in a Terminal window) when toggled ON
- ✅ Start frontend server (in a Terminal window) when toggled ON
- ✅ Show blue neon update indicator when updates are available

## 📋 Prerequisites

Before running, make sure you have:

1. **Python 3.8+** - [Download](https://www.python.org/downloads/)
2. **Node.js 16+** - [Download](https://nodejs.org/)
3. **Ollama** - [Install Guide](https://ollama.ai/)

### Installing Ollama

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download from [ollama.ai/download](https://ollama.ai/download)

## 🎯 First Time Setup

1. **Install Prerequisites:**
   - Python 3.8+ ([Download](https://www.python.org/downloads/))
   - Node.js 16+ ([Download](https://nodejs.org/))
   - Ollama ([Install Guide](https://ollama.ai/))

2. **Start Ollama:**
   ```bash
   ollama serve
   ```

3. **Install the AI model:**
   ```bash
   ollama pull llama3:latest
   ```

4. **Run Personal AI:**
   ```bash
   ./START.sh
   ```

The first time you run it, it will automatically install all dependencies. This may take a few minutes.

When it starts, you'll see a display showing:
- **Local:** http://localhost:7777
- **Network:** http://YOUR_IP:7777

## 🌐 Access

Once running:
- **Local:** http://localhost:7777
- **Network:** http://YOUR_IP:7777 (shown in terminal)

## 🎮 Usage

```bash
./INSTALL.sh   # Install dependencies (first time only)
./START.sh     # Launch the GUI application
```

The GUI provides:
- **Toggle Switch**: Turn servers ON/OFF
- **Status Display**: Real-time backend/frontend status
- **IP Addresses**: Click to open in browser
- **Update Indicator**: Blue neon light when updates available

## ✨ Features

- **Chat:** Unrestricted AI conversations with personal assistants
- **Image Generation:** Create images from text
- **Image Editing:** Edit images with natural language
- **Video Generation:** Generate videos from prompts
- **Song Writing:** Write songs with "For fans of" inspiration
- **User Accounts:** Personal login with AI assistant selection
- **Mobile Support:** Responsive design for phones and tablets
- **100% Local:** All processing on your machine

## 👥 User Accounts

Each user gets:
- Personal login (username + password)
- Choice of 7 biblical AI assistants
- Personal conversation history
- Private file storage

## 🤖 AI Assistants

Choose from 7 biblical archangels, each with unique personalities:
- **Michael** - Noble protector and leader
- **Gabriel** - Clear communicator and messenger
- **Raphael** - Compassionate healer
- **Uriel** - Wise scholar and guide
- **Ariel** - Bold warrior companion
- **Jophiel** - Creative artist
- **Chamuel** - Loving friend

## 📚 Documentation

Everything is self-contained. Run `./INSTALL.sh` once, then `./START.sh` to launch the GUI.

## 🔒 Privacy

- **100% LOCAL PROCESSING** - No data leaves your computer
- All AI processing via local Ollama
- All files stored locally
- Zero internet connectivity for photos, videos, or user data
- No external API calls

## 🔐 Security

**⚠️ IMPORTANT:** Before pushing to GitHub, ensure all API keys and credentials are removed. See [SECURITY.md](SECURITY.md) for details.

## 🛠️ Troubleshooting

**Application won't start:**
- Make sure Python 3.8+ and Node.js 16+ are installed
- Check that Ollama is running: `ollama serve`
- Verify the model is installed: `ollama list`

**Port already in use:**
- Stop other applications using ports 8000 or 7777
- Or use the toggle switch in the GUI to restart servers

**Installation fails:**
- Make sure you have internet connection (for downloading dependencies)
- Check that you have write permissions in the directory
- Verify prerequisites are installed: `python3 --version`, `node --version`, `ollama --version`

## 📝 License

Private use only.

---

**Ready? Just run `./START.sh` and enjoy!**
>>>>>>> 4ca1946f8db7d30d7fa1413e95ed00a23d87dab8
