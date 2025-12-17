#!/bin/bash
# Script to launch chaos_to_clarity.py.

# Get the directory of this script
APP_DIR="$(cd "$(dirname "$0")" && pwd)"

# Define the full command to run
# The 'cd' command uses the shell-quoted path, which the current bash/zsh session will handle.
# The 'read -n 1...' part is critical for keeping the window open if launched by a click.
RUN_COMMAND="cd \"$APP_DIR\" && 
             echo '==================================================' &&
             echo '   Welcome to Chaos-to-Clarity AI Prompt Engineer!' &&
             echo '==================================================' &&
             python3 chaos_to_clarity.py &&
             echo '==================================================' &&
             read -n 1 -s -r -p 'Press any key to close this terminal...'"

# --- Execution ---

# For your specific problem, we will now execute the command in the *current* shell.
# This bypasses all the complex AppleScript and new window quoting failures.
# This works for macOS and all Linux systems.

/bin/bash -c "$RUN_COMMAND"

# The script terminates here, having executed the application in the current window.
exit 0