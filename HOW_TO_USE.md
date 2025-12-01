# Personal AI - Installation & Usage Guide
## Simple Step-by-Step Instructions

## 📦 Step 1: Installation (One Time Only - Do This First!)

### What You Need
- A Mac computer
- Internet connection (for downloading dependencies)

### How to Install (Super Easy!)

**Option 1: Double-Click (Easiest!)**
1. Find the `INSTALL.sh` file in the Personal AI folder
2. Double-click it
3. It will automatically open in Terminal and start installing
4. Wait for it to finish (10-20 minutes)

**Option 2: Terminal Method**
1. Open Terminal (Press `Command + Space`, type "Terminal", press Enter)
2. Navigate to the Personal AI folder:
   ```bash
   cd "/path/to/PersonalAI"
   ```
   (Replace `/path/to/PersonalAI` with your actual folder location)
3. Run the installer:
   ```bash
   ./INSTALL.sh
   ```

### What Happens During Installation

The installer will **automatically** install everything:
- ✅ Homebrew (package manager) - if you don't have it
- ✅ Python 3.8+ - if you don't have it
- ✅ Node.js 16+ - if you don't have it
- ✅ Ollama (AI runtime) - if you don't have it
- ✅ AI model (~4GB download, takes 5-10 minutes)
- ✅ All Python packages
- ✅ All Node.js packages
- ✅ AI assistant avatars

**⏱️ This will take 10-20 minutes** depending on your internet speed.

**Just wait for it to finish!** You'll see "✅ Installation Complete!" when it's done.

**💡 Tip:** You can leave it running and do something else. It will install everything automatically.

---

## 🚀 Step 2: Starting Personal AI (Every Time You Want to Use It)

### How to Start (Super Easy!)

**Option 1: Double-Click (Easiest!)**
1. Find the `START.sh` file in the Personal AI folder
2. Double-click it
3. It will automatically open and show you the launcher

**Option 2: Terminal Method**
1. Open Terminal
2. Navigate to the Personal AI folder:
   ```bash
   cd "/path/to/PersonalAI"
   ```
3. Run the launcher:
   ```bash
   ./START.sh
   ```

### What You'll See

**If GUI works:**
- A window will open showing:
  - Server status (Ollama, Backend, Frontend)
  - Your localhost URL: `http://localhost:7777`
  - Your network IP address: `http://YOUR_IP:7777`
  - A toggle switch to turn servers ON/OFF

**If GUI doesn't work (some Macs):**
- Terminal will show:
  - Server status (Ollama, Backend, Frontend)
  - Your localhost and network URLs
  - Servers will start automatically

### Starting the Servers

**With GUI:**
1. Click the toggle switch to turn it ON (it will turn green)
2. Wait a moment - Terminal windows will open showing the servers starting
3. When ready, click the URLs or the "Open App" button

**With CLI (Terminal):**
- Servers start automatically
- You'll see Terminal windows open for each server
- Wait 10-20 seconds for everything to start

---

## 🎮 Using Personal AI

### Access the Application

- **On this computer:** Click `http://localhost:7777` in the GUI
- **On other devices on your network:** Click `http://YOUR_IP:7777` in the GUI

### First Time Setup

1. **Create an account**
   - Choose a username and password
   - No email required

2. **Select your AI assistant**
   - Choose from 7 biblical archangels
   - Each has a unique personality

3. **Complete onboarding**
   - Answer 10 questions about yourself
   - This helps your AI assistant get to know you

4. **Start chatting!**
   - Ask questions
   - Upload images/videos
   - Generate content
   - Everything runs 100% locally

---

## 🔄 Daily Usage

### Starting Personal AI (Every Day)

**Easy Method:**
1. Double-click `START.sh` (or run `./START.sh` in Terminal)
2. If GUI: Click toggle switch to ON
3. Wait 10-20 seconds for servers to start
4. Click the URL or "Open App" button

**What Starts:**
- Ollama server (AI runtime) - port 11434
- Backend server (API) - port 8000
- Frontend server (web interface) - port 7777

### Stopping Personal AI

**With GUI:**
1. Click the toggle switch to OFF
2. Servers will stop automatically

**With CLI or Manual:**
1. Close the Terminal windows that are running the servers
2. Or press `Ctrl+C` in each Terminal window

---

## 📱 Features

- **Chat:** Talk with your personal AI assistant
- **Image Generation:** Create images from text
- **Image Editing:** Edit images with natural language
- **Video Generation:** Create videos from prompts
- **Song Writing:** Write songs with "For fans of" inspiration
- **Bitcoin Wallets:** Generate BTC, BCH, and BSV wallets

---

## 🔔 Updates

When an update is available:
- A **blue neon light** will flash in the GUI
- Click "Update Available" to download the latest version
- The app will restart automatically

---

## ❓ Troubleshooting

### "Python 3 is required"
- Make sure you ran `./INSTALL.sh` first
- The installer should have installed Python automatically

### "Dependencies not installed"
- Run `./INSTALL.sh` again
- Make sure you have internet connection

### Servers won't start
- Check the Terminal windows for error messages
- Make sure you ran `./INSTALL.sh` first
- Try closing all Terminal windows and running `./START.sh` again
- Make sure ports 8000, 7777, and 11434 are not in use

### Can't access from other devices
- Make sure both devices are on the same Wi-Fi network
- Check your firewall settings
- Use the network IP shown in the GUI (not localhost)

---

## 📞 Quick Reference

### Installation (First Time Only)
- **Easiest:** Double-click `INSTALL.sh`
- **Or Terminal:** `./INSTALL.sh`
- **Takes:** 10-20 minutes
- **Do this:** Only once!

### Starting the App (Every Time)
- **Easiest:** Double-click `START.sh`
- **Or Terminal:** `./START.sh`
- **Takes:** 10-20 seconds to start

### Access URLs
- **On this computer:** `http://localhost:7777`
- **On other devices:** `http://YOUR_IP:7777` (shown in launcher)

### Server Ports
- **Ollama:** Port 11434 (AI runtime)
- **Backend:** Port 8000 (API)
- **Frontend:** Port 7777 (web interface)

---

**That's it! Enjoy your personal AI assistant.**

