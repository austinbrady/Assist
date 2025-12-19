# Chrome Extension Package Installer

This directory contains the package installer for the AssisantAI Chrome browser extension.

## Quick Start

Run the installer to install all dependencies:

```bash
./chrome/install.sh
```

Or from the chrome directory:

```bash
cd chrome
./install.sh
```

## What It Does

The installer script:

1. **Checks Prerequisites**

   - Verifies Node.js is installed
   - Verifies npm is installed
   - Checks extension directory exists

2. **Cleans Previous Installation**

   - Removes existing `node_modules` directory if present

3. **Installs Dependencies**

   - Runs `npm install` in the extension directory
   - Installs all required packages from `package.json`

4. **Verifies Installation**
   - Checks that key dependencies are installed:
     - React
     - React DOM
     - TypeScript
     - esbuild
     - @types/chrome

## Dependencies

The extension requires:

- **React** - UI framework for the floating widget
- **React DOM** - React rendering
- **TypeScript** - Type checking and compilation
- **esbuild** - Fast bundler for building the extension
- **@types/chrome** - TypeScript definitions for Chrome Extension API

## Building the Extension

After installation, build the extension:

```bash
cd extension
npm run build
```

This will create a `dist` folder with the compiled extension ready to load in Chrome.

## Loading in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `extension/dist` folder

## Troubleshooting

### Node.js Not Found

Install Node.js from [nodejs.org](https://nodejs.org/)

### npm Not Found

npm comes with Node.js. If you have Node.js but not npm, reinstall Node.js.

### Installation Fails

- Check your internet connection
- Try clearing npm cache: `npm cache clean --force`
- Delete `package-lock.json` and try again
- Check for permission issues in the extension directory

### Build Errors

- Ensure all dependencies are installed: `npm install`
- Check TypeScript errors: `npm run build` will show them
- Verify Chrome types are installed: `npm list @types/chrome`
