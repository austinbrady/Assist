# AssisantAI Central Hub

The central dashboard for managing all AssisantAI applications. This hub runs on port 4200 and provides a visual interface to see all apps, their ports, and manage their lifecycle.

## Features

- **Visual Dashboard**: See all registered apps at a glance
- **Port Management**: Automatically assigned ports starting from 4200
- **App Status**: Real-time status indicators (running/stopped/starting)
- **Start/Stop Controls**: Manage apps directly from the dashboard
- **Quick Access**: Direct links to open apps in new tabs

## Running the Hub

### Development
```bash
npm run dev:hub
```

### Production
```bash
npm run build --workspace=hub
npm run start:hub
```

The hub will be available at: **http://localhost:4200**

## Port Assignment

Static port assignments:
- **4199**: Middleware (API gateway)
- **4200**: Central Hub (this app)
- **4201**: MVP Assistant Backend
- **4202**: PersonalAI Backend
- **4203**: PersonalAI Frontend
- **4204**: MVP Assistant Frontend
- And so on...

## Registering Apps

Before apps appear in the hub, they need to be registered:

```bash
npm run register-app -- <app-id> <app-name> <type> [description]
```

Example:
```bash
npm run register-app -- mvp-assisant "MVP Assisant" frontend "Main dashboard application"
```

## App Structure

Apps should be placed in the `apps/` directory:
```
apps/
  └── mvp-assisant/
      ├── package.json
      └── ...
```

## Configuration

The hub connects to the middleware API to get app information. Configure the middleware URL in `hub/.env.local`:

```
NEXT_PUBLIC_MIDDLEWARE_URL=http://localhost:4199
```

## Features in Detail

### App Cards
Each app is displayed as a card showing:
- App name and type (backend/frontend/middleware)
- Current status with visual indicator
- Assigned port number
- Direct URL link (when running)
- Start/Stop controls

### Statistics
The dashboard shows:
- Total number of apps
- Number of running apps
- Number of stopped apps

### Auto-refresh
The dashboard automatically refreshes every 5 seconds to show the latest app status.

