# Parent Project: AssistantAI

MVP Assistant is now a **child app** of the **AssistantAI** master project.

## Relationship

- **Parent**: AssistantAI (`/Volumes/Austin's Flash Drive (Mac)/AssisantAI`)
- **Child**: MVP Assistant (this project)
- **Status**: Managed by AssistantAI

## What This Means

1. **Installation**: When AssistantAI runs its installer, it automatically installs MVP Assistant
2. **Management**: MVP Assistant is managed through AssistantAI's hub dashboard
3. **Integration**: MVP Assistant routes all requests through AssistantAI master controller
4. **Configuration**: MVP Assistant is registered in AssistantAI's `config/apps.json` and `config/ports.json`

## Standalone Usage

MVP Assistant can still be used standalone:
- Run `./INSTALL.sh` to install dependencies
- Run `./START.sh` to start the application
- Backend: http://localhost:4203
- Frontend: http://localhost:4202

However, when used as part of AssistantAI:
- Installation is handled by AssistantAI
- Management is through AssistantAI's hub
- Ports are assigned automatically by AssistantAI
- Integration with PersonalAI and other apps is automatic

## Configuration in AssistantAI

MVP Assistant is configured in:
- `/Volumes/Austin's Flash Drive (Mac)/AssisantAI/config/apps.json`
- `/Volumes/Austin's Flash Drive (Mac)/AssisantAI/config/ports.json`
- `/Volumes/Austin's Flash Drive (Mac)/AssisantAI/middleware/config/apps.json`

## Sister Apps

Other child apps in the AssistantAI ecosystem:
- **PersonalAI** - Base backend infrastructure and sister app to MVP Assistant

## Architecture

```
AssistantAI (Master)
├── PersonalAI (Base Backend)
└── MVP Assistant (This App)
```

All apps share:
- **Unified Authentication**: Single sign-on across all apps
- **Shared Agent**: Same AI agent personality and memory
- **Cross-App Data**: Shared user data and conversation history

## Documentation

For more information about the AssistantAI ecosystem:
- See `/Volumes/Austin's Flash Drive (Mac)/AssisantAI/README.md`
- See `/Volumes/Austin's Flash Drive (Mac)/AssisantAI/docs/INTEGRATION_GUIDE.md`
- See `/Volumes/Austin's Flash Drive (Mac)/AssisantAI/docs/PORT_MANAGEMENT.md`

