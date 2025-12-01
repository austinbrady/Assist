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
