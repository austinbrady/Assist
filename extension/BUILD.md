# Build Instructions

## Prerequisites

```bash
npm install
```

## Build

```bash
npm run build
```

This will:
1. Compile TypeScript files
2. Bundle background script
3. Bundle floating widget (with React)
4. Bundle content script
5. Bundle popup and options pages
6. Copy assets and styles

## Development

For development, run:

```bash
npm run build
```

Then reload the extension in Chrome/Brave:
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Reload" on the extension

## Loading Extension

1. Open Chrome/Brave
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `extension` directory (or `dist` if you built it)

## File Structure After Build

```
dist/
├── background/
│   └── background.js
├── content/
│   ├── content.js
│   ├── floating-widget.js
│   └── styles.css
├── popup/
│   └── popup.js
├── options/
│   └── options.js
└── assets/
    └── icons/
```

## Troubleshooting

### React not loading
- Make sure `floating-widget.js` is bundled with React
- Check browser console for errors
- Verify `web_accessible_resources` in manifest.json

### Content script not running
- Check `content_scripts` in manifest.json
- Verify file paths are correct
- Check browser console for errors

### Backend connection issues
- Verify backend is running on localhost:4202
- Check options page for correct backend URL
- Test connection using "Test Connection" button
