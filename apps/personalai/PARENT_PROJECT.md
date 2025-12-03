# Parent Project: AssistantAI

PersonalAI is now a **child app** of the **AssistantAI** master project.

## Relationship

- **Parent**: AssistantAI (`/Volumes/Austin's Flash Drive (Mac)/AssisantAI`)
- **Child**: PersonalAI (this project)
- **Status**: Managed by AssistantAI

## What This Means

1. **Installation**: When AssistantAI runs its installer, it automatically installs PersonalAI
2. **Management**: PersonalAI is managed through AssistantAI's hub dashboard
3. **Integration**: PersonalAI serves as the base backend for all AssistantAI apps
4. **Configuration**: PersonalAI is registered in AssistantAI's `config/apps.json`

## Standalone Usage

PersonalAI can still be used standalone:
- Run `./INSTALL.sh` to install dependencies
- Run `./START.sh` to start the application
- Access at http://localhost:7777

However, when used as part of AssistantAI:
- Installation is handled by AssistantAI
- Management is through AssistantAI's hub
- Integration with other apps is automatic

## Configuration in AssistantAI

PersonalAI is configured in:
- `/Volumes/Austin's Flash Drive (Mac)/AssisantAI/config/apps.json`
- `/Volumes/Austin's Flash Drive (Mac)/AssisantAI/middleware/config/apps.json`

## Sister Apps

Other child apps in the AssistantAI ecosystem:
- **MVP Assistant** - Sister app to PersonalAI

## Documentation

For more information about the AssistantAI ecosystem:
- See `/Volumes/Austin's Flash Drive (Mac)/AssisantAI/README.md`
- See `/Volumes/Austin's Flash Drive (Mac)/AssisantAI/docs/INTEGRATION_GUIDE.md`

