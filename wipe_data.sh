#!/bin/bash

# Wipe all chat history and user accounts
# This resets the system to a clean state

echo "⚠️  WARNING: This will delete all user accounts and chat history!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo "🗑️  Wiping user data..."

# Remove user accounts
rm -rf apps/personalai/backend/users/*.json
rm -rf apps/personalai/backend/users/*/
rm -rf apps/mvpassistant/backend/users/*.json
rm -rf apps/mvpassistant/backend/users/*/

# Remove chat logs
rm -rf apps/personalai/backend/chat_logs/*
rm -rf apps/mvpassistant/backend/chat_logs/*

# Remove user data
rm -rf apps/personalai/backend/users_data/*
rm -rf apps/mvpassistant/backend/users_data/*

# Remove user solutions
rm -rf apps/mvpassistant/backend/users_solutions/*

# Keep .gitkeep files
touch apps/personalai/backend/chat_logs/.gitkeep
touch apps/personalai/backend/users_data/.gitkeep
touch apps/mvpassistant/backend/chat_logs/.gitkeep
touch apps/mvpassistant/backend/users_data/.gitkeep

echo "✅ All user data and chat history wiped!"

