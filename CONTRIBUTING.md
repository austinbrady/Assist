# Contributing to AssisantAI

Thank you for your interest in contributing to AssisantAI!

## Getting Started

1. Fork the repository
2. Clone your fork
3. Run the installer: `./install.sh`
4. Create a branch for your changes

## Development Workflow

1. **Make your changes** in a feature branch
2. **Test your changes:**
   ```bash
   npm run build
   npm test
   ```
3. **Update documentation** if needed
4. **Commit your changes** with clear messages
5. **Push and create a Pull Request**

## Code Style

- Use TypeScript for all new code
- Follow existing code style
- Add comments for complex logic
- Update documentation for API changes

## Adding a New App

1. Create app in `apps/` directory
2. Use `@assisant-ai/auth` and `@assisant-ai/agent`
3. Register in `middleware/config/apps.json`
4. Update documentation

## Adding a New Package

1. Create package in `packages/` directory
2. Add to root `package.json` workspaces
3. Export from `src/index.ts`
4. Update documentation

## Testing

- Write tests for new features
- Ensure all tests pass
- Test integration with middleware

## Documentation

- Update README.md for user-facing changes
- Update docs/ for architecture changes
- Add code comments for complex logic

## Questions?

Open an issue or start a discussion!

