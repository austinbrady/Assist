# Security Notes

## ⚠️ IMPORTANT: API Keys and Credentials

**ALL API KEYS AND CREDENTIALS MUST BE REMOVED BEFORE PUSHING TO GITHUB**

### Files That Contain Sensitive Information

The following files and patterns contain API keys or credentials and should **NEVER** be committed to GitHub:

1. **Credential Files:**
   - `PERSONALAI_CREDENTIALS_FOR_CHELASX.txt` - Contains PersonalAI API key
   - Any file matching `*CREDENTIALS*.txt` or `*credentials*.txt`
   - Any file matching `*API_KEY*.txt` or `*api_key*.txt`

2. **User API Keys:**
   - `backend/users/*/api_keys.json` - User-specific API keys stored per user
   - `backend/users_data/*/api_keys.json` - Additional user data API keys

3. **Environment Files:**
   - `.env` - Environment variables (already in .gitignore)
   - `.env.local` - Local environment variables (already in .gitignore)

### Before Committing to GitHub

**ALWAYS CHECK:**
1. ✅ Review all files in `git status` before committing
2. ✅ Ensure `.gitignore` includes all credential file patterns
3. ✅ Verify no API keys are hardcoded in source files
4. ✅ Remove or redact any API keys from documentation files
5. ✅ Use environment variables or secure vaults for API keys in production

### Current API Key Locations

- **PersonalAI API Key:** Stored in `PERSONALAI_CREDENTIALS_FOR_CHELASX.txt` (should be in .gitignore)
- **User API Keys:** Stored in `backend/users/{username}/api_keys.json` (should be in .gitignore)
- **Cursor API Key:** Used in frontend but should be stored securely, not hardcoded

### Best Practices

1. **Never commit API keys directly in code**
2. **Use environment variables** for API keys in production
3. **Add credential files to .gitignore** immediately
4. **Review git history** if you accidentally committed keys (use `git filter-branch` or BFG Repo-Cleaner to remove)
5. **Rotate API keys** if they were ever exposed in git history

### If You Accidentally Committed Keys

If API keys were committed to git:

1. **Immediately rotate the exposed keys** on the service provider
2. **Remove from git history** using:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch PATH_TO_FILE" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push** (coordinate with team first):
   ```bash
   git push origin --force --all
   ```

---

**Remember: Once API keys are in git history, they are potentially exposed forever. Always rotate keys that were committed, even if you remove them later.**

