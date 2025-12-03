# Port Management System

AssisantAI uses an automated port management system to assign ports to applications, starting from port 4200.

## Port Assignment Rules

1. **Base Port**: 4200 (configurable in `config/ports.json`)
2. **Sequential Assignment**: Ports are assigned sequentially (4200, 4201, 4202, ...)
3. **Automatic Detection**: The system checks if ports are available before assignment
4. **Persistent Storage**: Port assignments are saved in `config/ports.json`

## Default Ports

- **4200**: Central Hub (dashboard)
- **4201**: MVP Assisant (first app)
- **4202**: Next app
- **4203**: Next app
- And so on...

## Registering Apps

### Using the CLI

```bash
npm run register-app -- <app-id> <app-name> <type> [description]
```

**Parameters:**
- `app-id`: Unique identifier (e.g., `mvp-assisant`)
- `app-name`: Display name (e.g., `MVP Assisant`)
- `type`: One of `backend`, `frontend`, or `middleware`
- `description`: Optional description

**Example:**
```bash
npm run register-app -- mvp-assisant "MVP Assisant" frontend "Main dashboard application"
```

### Programmatically

```typescript
import { getPortManager } from '@assisant-ai/port-manager';

const portManager = getPortManager();
const port = await portManager.registerApp(
  'my-app',
  'My App',
  'frontend',
  'Description here'
);
console.log(`Assigned port: ${port}`);
```

## Port Configuration File

Port assignments are stored in `config/ports.json`:

```json
{
  "basePort": 4200,
  "apps": [
    {
      "id": "personalai",
      "name": "PersonalAI",
      "port": 4200,
      "description": "Base backend infrastructure",
      "enabled": true,
      "type": "backend",
      "status": "stopped"
    }
  ]
}
```

## Port Manager API

### Get Port for App
```typescript
const port = portManager.getPort('app-id');
```

### Get All Apps
```typescript
const apps = portManager.getAllApps();
```

### Get Enabled Apps
```typescript
const enabledApps = portManager.getEnabledApps();
```

### Update App Status
```typescript
portManager.updateAppStatus('app-id', 'running');
```

### Get Next Available Port
```typescript
const nextPort = await portManager.getNextAvailablePort();
```

## App Configuration

When registering an app, ensure it's configured to use the assigned port:

### Node.js/Express
```javascript
const PORT = process.env.PORT || 4201;
app.listen(PORT);
```

### Next.js
```bash
next start -p 4201
```

### Python/FastAPI
```python
uvicorn main:app --port 4201
```

## Port Conflicts

If a port is already in use, the system will:
1. Detect the conflict
2. Find the next available port
3. Assign that port instead

## Viewing Port Assignments

### Via Central Hub
Access the hub at `http://localhost:4200` to see all apps and their ports.

### Via API
```bash
curl http://localhost:3000/api/hub/apps
```

### Via Config File
```bash
cat config/ports.json
```

## Best Practices

1. **Don't hardcode ports**: Always use the assigned port from the port manager
2. **Use environment variables**: Set `PORT` environment variable in your app
3. **Check port availability**: The system does this automatically, but you can verify
4. **Update status**: Update app status when starting/stopping apps

## Troubleshooting

### Port Already in Use
If you get a "port already in use" error:
1. Check what's using the port: `lsof -i :4201`
2. Stop the conflicting process
3. Or register the app again to get a new port

### Port Not Assigned
If an app doesn't have a port:
1. Register the app using `npm run register-app`
2. Check `config/ports.json` to verify registration
3. Restart the middleware server

### Port Range Exhausted
If you run out of ports (unlikely):
1. Increase the `basePort` in `config/ports.json`
2. Or manually assign ports in the config file

