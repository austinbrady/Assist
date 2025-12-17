# Assist Browser Extension

Browser extension that makes Assist available everywhere on the web with full context awareness.

## Development

### Build

```bash
npm install
npm run build
```

### Load in Browser

1. Open Chrome/Brave
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `extension` directory

## Features

- **Context-aware chat** - Understands what you're viewing
- **Local-first backend** - Connects to local PersonalAI backend
- **Cloud fallback** - Falls back to cloud if local unavailable
- **Autofill** - Intelligent form filling with undo
- **Floating widget** - Always accessible chat interface

## Configuration

Open extension options to configure:
- Backend URLs (local and cloud)
- Connection preferences
- Context awareness settings
- Autofill preferences
