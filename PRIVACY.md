# Privacy & Local-First Architecture

## Core Philosophy

AssisantAI is built with **privacy-first, local-first** principles. All user data stays on the user's machine unless explicitly configured otherwise.

## Local-Only Default

### Default Configuration

- **LLM**: Uses local Ollama (`llama3:latest`) by default
- **Data Storage**: All user data stored locally in `apps/personalai/backend/users/`
- **No Cloud Services**: No external APIs called by default
- **No Data Sharing**: Users are completely isolated - no shared accounts or data

### User Data Isolation

- Each user has their own directory: `users/{username}/`
- User data directories: `users_data/{username}/`
- Chat logs: `chat_logs/{username}/`
- Solutions: `users_solutions/{username}/`
- **No cross-user data access** - complete isolation

## Optional Cloud Services

### Gemini Integration (Optional)

Gemini API support is **opt-in only**:

- Requires `GEMINI_API_KEY` environment variable
- Default model remains `llama3` (local) if no key provided
- Users can choose to use Gemini for enhanced capabilities
- **User data is never sent to Gemini** - only prompts/responses

### Configuration

To enable Gemini (optional):

```bash
export GEMINI_API_KEY="your-key-here"
export LLM_MODEL="gemini-2.5-flash"
```

To stay 100% local:

```bash
# Don't set GEMINI_API_KEY
export LLM_MODEL="llama3"  # or any local Ollama model
```

## Data Privacy Guarantees

1. **No User Data Sharing**: Users cannot see each other's data
2. **Local Storage Only**: All data stored in local directories
3. **No Telemetry**: No usage tracking or analytics
4. **No External Connections**: By default, only connects to localhost
5. **Encrypted Memory**: User memory files are encrypted locally

## Removing User Data

To remove all user accounts and data:

```bash
./wipe_data.sh
```

Or manually:

- Clear `apps/personalai/backend/users/users.json`
- Remove user directories: `users/{username}/`, `users_data/{username}/`, etc.
- Clear audit logs: `users/audit_log.json`, `users/username_log.json`

## Extension Privacy

The browser extension:

- Connects to **local backend first** (localhost:4202)
- Falls back to cloud only if local unavailable (and only if configured)
- Stores tokens in `chrome.storage.local` (browser-local, not synced)
- Never shares user data between users
- All page analysis happens locally in the browser

## Best Practices

1. **For Maximum Privacy**: Don't set `GEMINI_API_KEY` - use only local Ollama
2. **User Isolation**: Each user account is completely separate
3. **Local Backend**: Always run backend locally (default configuration)
4. **No Shared Accounts**: Each installation is independent
