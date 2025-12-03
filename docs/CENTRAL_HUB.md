# Central Hub Dashboard

The AssisantAI Central Hub is a beautiful, modern dashboard that provides a single interface to manage all your AI assistant applications.

## Overview

The hub runs on **port 4000** and provides:
- Visual overview of all registered apps
- Real-time status monitoring
- One-click start/stop controls
- Direct links to access apps
- Port assignment visibility

## Accessing the Hub

After installation, start the hub:

```bash
npm run start:hub
```

Or use the convenience script:

```bash
npm run start:all
```

Then open your browser to: **http://localhost:4000**

## Features

### Dashboard View

The main dashboard shows:
- **Statistics Cards**: Total apps, running apps, stopped apps
- **App Cards**: One card per registered app showing:
  - App name and type badge (backend/frontend/middleware)
  - Current status with visual indicator
  - Assigned port number
  - Direct URL (when running)
  - Start/Stop button
  - Open link button

### Status Indicators

- 🟢 **Running**: Green pulsing dot - app is active
- ⚪ **Stopped**: Gray dot - app is not running
- 🟡 **Starting**: Yellow pulsing dot - app is starting up

### App Management

#### Starting an App
1. Click the **Start** button on an app card
2. Status changes to "starting"
3. Once ready, status changes to "running"
4. URL becomes clickable

#### Stopping an App
1. Click the **Stop** button on a running app
2. Status changes to "stopped"
3. URL link is removed

#### Opening an App
1. Click the **Open** button (only visible when running)
2. App opens in a new tab at its assigned port

## Port Display

Each app card clearly shows:
- **Port**: The assigned port number (e.g., 4201, 4202)
- **URL**: Full URL when app is running (e.g., http://localhost:4201)

## Auto-Refresh

The dashboard automatically refreshes every 5 seconds to show:
- Latest app status
- Newly registered apps
- Port changes

## Registering Apps

Before apps appear in the hub, register them:

```bash
npm run register-app -- <app-id> <app-name> <type> [description]
```

Example:
```bash
npm run register-app -- mvp-assisant "MVP Assisant" frontend "Main dashboard"
```

After registration, the app will appear in the hub dashboard.

## Configuration

The hub connects to the middleware API. Configure in `hub/.env.local`:

```
NEXT_PUBLIC_MIDDLEWARE_URL=http://localhost:3000
```

## Troubleshooting

### Hub Not Loading
- Check if middleware is running: `curl http://localhost:3000/health`
- Check hub logs: `logs/hub.log`
- Verify port 4000 is available: `lsof -i :4000`

### Apps Not Showing
- Verify apps are registered: `cat config/ports.json`
- Check middleware is running
- Refresh the dashboard (auto-refreshes every 5 seconds)

### Can't Start Apps
- Check app directory exists in `apps/<app-id>/`
- Verify app has proper `package.json` or startup script
- Check middleware logs: `logs/middleware.log`

### Port Conflicts
- Check what's using the port: `lsof -i :4201`
- Re-register app to get new port: `npm run register-app -- ...`

## Development

### Running in Development Mode

```bash
npm run dev:hub
```

### Building for Production

```bash
npm run build --workspace=hub
npm run start:hub
```

## Design

The hub features:
- Modern gradient background
- Responsive grid layout
- Smooth animations
- Color-coded app types
- Real-time status updates

## API Integration

The hub uses the middleware API endpoints:
- `GET /api/hub/apps` - Get all apps
- `POST /api/hub/apps/:id/start` - Start an app
- `POST /api/hub/apps/:id/stop` - Stop an app
- `POST /api/hub/apps/register` - Register new app

See middleware documentation for API details.

