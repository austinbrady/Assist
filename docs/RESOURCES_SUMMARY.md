# Resources Summary: MVP Assistant & PersonalAI

This document provides a comprehensive overview of all resources, dependencies, and configurations for both applications in the AssistantAI project.

---

## 📦 PersonalAI Resources

### **Ports**
- **Backend**: `4200` (default, managed by AssistantAI port manager)
- **Frontend**: `4201` (default, managed by AssistantAI port manager)
- **Mobile**: Expo default ports

### **Backend Dependencies** (`apps/personalai/backend/requirements.txt`)
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
aiofiles==23.2.1
httpx==0.25.2
pillow==10.1.0
opencv-python==4.8.1.78
numpy==1.24.3
pydantic==2.5.0
python-dotenv==1.0.0
passlib[bcrypt]==1.7.4
python-jose[cryptography]==3.3.0
base58==2.1.1
imagehash==4.3.1
qrcode[pil]==7.4.2
eth-keys==0.4.0
eth-utils==2.3.1
nacl==1.5.0

# Music Generation (MusicGen from AudioCraft)
torch>=2.0.0
torchaudio>=2.0.0
audiocraft>=1.3.0
scipy>=1.10.0
soundfile>=0.12.0
librosa>=0.10.0
mido>=2.0.0
python-rtmidi>=2.3.0
```

### **Frontend Dependencies** (`apps/personalai/frontend/package.json`)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.4",
    "axios": "^1.6.2",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.3.6",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.0.4"
  }
}
```

### **Mobile Dependencies** (`apps/personalai/mobile/package.json`)
```json
{
  "dependencies": {
    "@expo/vector-icons": "^13.0.0",
    "@react-native-async-storage/async-storage": "1.19.3",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "axios": "^1.6.2",
    "expo": "~49.0.0",
    "expo-image-picker": "~14.3.2",
    "expo-splash-screen": "~0.20.5",
    "expo-status-bar": "~1.6.0",
    "react": "18.2.0",
    "react-native": "0.72.6",
    "react-native-qrcode-svg": "^6.3.20",
    "react-native-safe-area-context": "4.6.3",
    "react-native-screens": "~3.22.0",
    "react-native-svg": "^15.15.1"
  }
}
```

### **Installation Scripts**
- **INSTALL.sh**: Installs Homebrew, Python 3, Node.js, Ollama, and all dependencies
- **START.sh**: Starts backend and frontend using ports from AssistantAI port manager

### **Key Features**
- Chat with 7 biblical archangel assistants
- Image generation & editing
- Video generation & editing
- Song writing
- 20+ automation skills (Email, Calendar, To-Do, Bills, Business Manager, CRM, Code Assistance, etc.)
- Memory management with conversation summaries
- Wallet services (Solana, Ethereum)
- Music generation (MusicGen)
- Audio analysis and MIDI generation

---

## 📦 MVP Assistant Resources

### **Ports**
- **Backend**: `4203` (default, managed by AssistantAI port manager)
- **Frontend**: `4202` (default, managed by AssistantAI port manager)
- **Mobile**: Expo default ports

### **Backend Dependencies** (`apps/mvpassistant/backend/requirements.txt`)
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
aiofiles==23.2.1
httpx==0.25.2
pillow==10.1.0
opencv-python==4.8.1.78
numpy==1.24.3
pydantic==2.5.0
python-dotenv==1.0.0
passlib[bcrypt]==1.7.4
python-jose[cryptography]==3.3.0
base58==2.1.1
reportlab>=4.0.0
matplotlib>=3.7.0
pandas>=2.0.0
openpyxl>=3.1.0
```

### **Frontend Dependencies** (`apps/mvpassistant/frontend/package.json`)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.4",
    "axios": "^1.6.2",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.3.6",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.0.4"
  }
}
```

### **Mobile Dependencies** (`apps/mvpassistant/mobile/package.json`)
```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "1.21.0",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "axios": "^1.6.2",
    "expo": "~50.0.0",
    "expo-battery": "~7.7.2",
    "expo-calendar": "~12.2.1",
    "expo-camera": "~14.1.3",
    "expo-contacts": "~12.8.2",
    "expo-device": "~5.9.4",
    "expo-file-system": "~16.0.0",
    "expo-location": "~16.5.0",
    "expo-media-library": "~15.9.2",
    "expo-network": "~5.8.0",
    "expo-notifications": "~0.27.0",
    "expo-secure-store": "~12.8.0",
    "expo-sensors": "~12.9.1",
    "expo-sharing": "~11.10.0",
    "react": "18.2.0",
    "react-native": "0.73.6",
    "react-native-gesture-handler": "~2.14.0",
    "react-native-reanimated": "~3.6.0",
    "react-native-safe-area-context": "4.8.2",
    "react-native-screens": "~3.29.0"
  }
}
```

### **Installation Scripts**
- **INSTALL.sh**: Installs Homebrew, Python 3, Node.js, Ollama, and all dependencies
- **START.sh**: Starts backend and frontend servers

### **Key Features**
- Dynamic app generation (builds apps/skills on-demand)
- Problem-driven development (user describes problem → AI generates solution)
- Full GUI applications with data persistence
- History tracking and exports
- Visualizations and reports
- Full device access on mobile (camera, contacts, calendar, location, etc.)

---

## 🔄 Shared Resources

### **Common Backend Dependencies**
Both applications share these core dependencies:
- FastAPI (web framework)
- Uvicorn (ASGI server)
- Python-multipart (file uploads)
- Aiofiles (async file operations)
- HTTPX (HTTP client)
- Pillow (image processing)
- OpenCV (computer vision)
- NumPy (numerical computing)
- Pydantic (data validation)
- Python-dotenv (environment variables)
- Passlib (password hashing)
- Python-jose (JWT tokens)
- Base58 (encoding)

### **Common Frontend Dependencies**
Both frontends use:
- React 18.2.0
- Next.js 14.0.4
- Axios 1.6.2
- Lucide React (icons)
- TypeScript 5.3.3
- Tailwind CSS 3.3.6

### **External Services**
- **Ollama**: Required for both apps (localhost:11434)
  - Model: `llama3:latest` (~4GB download)

---

## 📁 Project Structure

```
apps/
├── personalai/
│   ├── backend/          # FastAPI backend (Python)
│   ├── frontend/         # Next.js frontend (TypeScript/React)
│   ├── mobile/          # React Native mobile app
│   ├── INSTALL.sh       # Installation script
│   ├── START.sh         # Start script (uses AssistantAI ports)
│   └── package.json     # App package configuration
│
└── mvpassistant/
    ├── backend/          # FastAPI backend (Python)
    ├── frontend/         # Next.js frontend (TypeScript/React)
    ├── mobile/          # React Native mobile app
    ├── INSTALL.sh       # Installation script
    ├── START.sh         # Start script
    └── README.md        # Documentation
```

---

## 🚀 Quick Start Commands

### **PersonalAI**
```bash
# Install
cd apps/personalai
./INSTALL.sh

# Start (uses ports from AssistantAI port manager)
./START.sh

# Or manually
npm run install:backend
npm run install:frontend
npm run start:backend
npm run start:frontend
```

### **MVP Assistant**
```bash
# Install
cd apps/mvpassistant
./INSTALL.sh

# Start
./START.sh
```

---

## 📊 Resource Comparison

| Resource | PersonalAI | MVP Assistant |
|----------|-----------|---------------|
| **Backend Port** | 4200 | 4203 |
| **Frontend Port** | 4201 | 4202 |
| **Backend Framework** | FastAPI | FastAPI |
| **Frontend Framework** | Next.js 14 | Next.js 14 |
| **Mobile Framework** | React Native/Expo 49 | React Native/Expo 50 |
| **Python Dependencies** | 28 packages | 17 packages |
| **Special Features** | Music generation, Audio analysis, 20+ skills | Dynamic app generation, Full device access |
| **Base Backend** | ✅ Yes (for AssistantAI) | ❌ No |

---

## 🔧 Configuration Files

### **AssistantAI App Configuration** (`config/apps.json`)
- Defines app metadata, ports, and startup scripts
- Managed by AssistantAI port manager
- Both apps registered here

### **Port Management** (`config/ports.json`)
- Auto-assigned ports for each app
- Managed by AssistantAI port manager
- Prevents port conflicts

---

## 📝 Notes

1. **PersonalAI** serves as the base backend for the AssistantAI ecosystem
2. Both apps share the same AI agent, authentication, and conversation history
3. Ports are automatically managed by AssistantAI's port management system
4. Installation scripts handle all prerequisites (Homebrew, Python, Node.js, Ollama)
5. Mobile apps require Expo CLI and device-specific setup
6. Both apps require Ollama to be running on localhost:11434

