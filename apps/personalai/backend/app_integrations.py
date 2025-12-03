"""
App Integration Framework - Gather user context from other apps
PersonalAI seeks access to as many apps as possible to better understand the user
"""
import json
import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import subprocess
import platform
import os

# Integration directory
INTEGRATIONS_DIR = Path("users_data")

def get_user_integration_dir(username: str) -> Path:
    """Get user's integration directory"""
    user_dir = INTEGRATIONS_DIR / username
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir


def get_available_apps() -> List[Dict]:
    """Get list of available apps that PersonalAI can integrate with"""
    apps = []
    system = platform.system()
    
    if system == "Darwin":  # macOS
        apps.extend([
            {
                "id": "calendar",
                "name": "Calendar",
                "category": "productivity",
                "description": "Access calendar events and schedules",
                "enabled": False,
                "permissions_required": ["calendar_read", "calendar_write"]
            },
            {
                "id": "contacts",
                "name": "Contacts",
                "category": "communication",
                "description": "Access contact information",
                "enabled": False,
                "permissions_required": ["contacts_read"]
            },
            {
                "id": "reminders",
                "name": "Reminders",
                "category": "productivity",
                "description": "Access reminders and to-do items",
                "enabled": False,
                "permissions_required": ["reminders_read", "reminders_write"]
            },
            {
                "id": "notes",
                "name": "Notes",
                "category": "productivity",
                "description": "Access notes and documents",
                "enabled": False,
                "permissions_required": ["notes_read"]
            },
            {
                "id": "mail",
                "name": "Mail",
                "category": "communication",
                "description": "Access email messages",
                "enabled": False,
                "permissions_required": ["mail_read"]
            },
            {
                "id": "messages",
                "name": "Messages",
                "category": "communication",
                "description": "Access text messages and iMessages",
                "enabled": False,
                "permissions_required": ["messages_read"]
            },
            {
                "id": "photos",
                "name": "Photos",
                "category": "media",
                "description": "Access photo library for context",
                "enabled": False,
                "permissions_required": ["photos_read"]
            },
            {
                "id": "music",
                "name": "Music",
                "category": "media",
                "description": "Access music library and listening habits",
                "enabled": False,
                "permissions_required": ["music_read"]
            },
            {
                "id": "spotify",
                "name": "Spotify",
                "category": "media",
                "description": "Access Spotify listening data",
                "enabled": False,
                "permissions_required": ["spotify_api"],
                "api_required": True
            },
            {
                "id": "slack",
                "name": "Slack",
                "category": "communication",
                "description": "Access Slack messages and channels",
                "enabled": False,
                "permissions_required": ["slack_api"],
                "api_required": True
            },
            {
                "id": "discord",
                "name": "Discord",
                "category": "communication",
                "description": "Access Discord messages and activity",
                "enabled": False,
                "permissions_required": ["discord_api"],
                "api_required": True
            },
            {
                "id": "github",
                "name": "GitHub",
                "category": "development",
                "description": "Access GitHub repositories and activity",
                "enabled": False,
                "permissions_required": ["github_api"],
                "api_required": True
            },
            {
                "id": "notion",
                "name": "Notion",
                "category": "productivity",
                "description": "Access Notion pages and databases",
                "enabled": False,
                "permissions_required": ["notion_api"],
                "api_required": True
            },
            {
                "id": "google_drive",
                "name": "Google Drive",
                "category": "storage",
                "description": "Access Google Drive files and documents",
                "enabled": False,
                "permissions_required": ["google_api"],
                "api_required": True
            },
            {
                "id": "dropbox",
                "name": "Dropbox",
                "category": "storage",
                "description": "Access Dropbox files",
                "enabled": False,
                "permissions_required": ["dropbox_api"],
                "api_required": True
            },
            {
                "id": "twitter",
                "name": "Twitter/X",
                "category": "social",
                "description": "Access Twitter activity and preferences",
                "enabled": False,
                "permissions_required": ["twitter_api"],
                "api_required": True
            },
            {
                "id": "reddit",
                "name": "Reddit",
                "category": "social",
                "description": "Access Reddit activity and interests",
                "enabled": False,
                "permissions_required": ["reddit_api"],
                "api_required": True
            }
        ])
    elif system == "Linux":
        # Linux app integrations
        apps.extend([
            {
                "id": "calendar_evolution",
                "name": "Evolution Calendar",
                "category": "productivity",
                "description": "Access Evolution calendar",
                "enabled": False,
                "permissions_required": ["calendar_read"]
            },
            {
                "id": "thunderbird",
                "name": "Thunderbird",
                "category": "communication",
                "description": "Access Thunderbird email",
                "enabled": False,
                "permissions_required": ["email_read"]
            }
        ])
    elif system == "Windows":
        # Windows app integrations
        apps.extend([
            {
                "id": "outlook",
                "name": "Microsoft Outlook",
                "category": "communication",
                "description": "Access Outlook email and calendar",
                "enabled": False,
                "permissions_required": ["outlook_api"],
                "api_required": True
            },
            {
                "id": "onedrive",
                "name": "OneDrive",
                "category": "storage",
                "description": "Access OneDrive files",
                "enabled": False,
                "permissions_required": ["onedrive_api"],
                "api_required": True
            }
        ])
    
    return apps


def get_user_app_integrations(username: str) -> Dict:
    """Get user's app integration settings"""
    user_dir = get_user_integration_dir(username)
    integrations_file = user_dir / ".app_integrations.json"
    
    if not integrations_file.exists():
        return {
            "username": username,
            "integrated_apps": {},
            "api_keys": {},
            "last_updated": datetime.datetime.now().isoformat()
        }
    
    try:
        with open(integrations_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {
            "username": username,
            "integrated_apps": {},
            "api_keys": {},
            "last_updated": datetime.datetime.now().isoformat()
        }


def save_user_app_integrations(username: str, integrations: Dict):
    """Save user's app integration settings"""
    user_dir = get_user_integration_dir(username)
    integrations_file = user_dir / ".app_integrations.json"
    
    integrations["last_updated"] = datetime.datetime.now().isoformat()
    
    try:
        with open(integrations_file, "w", encoding="utf-8") as f:
            json.dump(integrations, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving app integrations: {e}")


async def gather_calendar_context(username: str) -> Optional[Dict]:
    """Gather context from Calendar app"""
    try:
        if platform.system() == "Darwin":  # macOS
            # Use AppleScript to access Calendar
            script = '''
            tell application "Calendar"
                set eventList to {}
                set todayEvents to events of calendars whose (start date is greater than or equal to (current date)) and (start date is less than (current date + 7 * days))
                repeat with calEvent in todayEvents
                    set end of eventList to {summary:summary of calEvent, start_date:string of start date of calEvent, location:location of calEvent}
                end repeat
                return eventList
            end tell
            '''
            
            result = subprocess.run(
                ["osascript", "-e", script],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                return {
                    "source": "calendar",
                    "data": result.stdout,
                    "timestamp": datetime.datetime.now().isoformat()
                }
    except Exception as e:
        print(f"Error gathering calendar context: {e}")
    
    return None


async def gather_contacts_context(username: str) -> Optional[Dict]:
    """Gather context from Contacts app"""
    try:
        if platform.system() == "Darwin":  # macOS
            script = '''
            tell application "Contacts"
                set contactList to {}
                repeat with person in people
                    set end of contactList to {name:name of person, company:organization of person, email:value of email 1 of person}
                end repeat
                return contactList
            end tell
            '''
            
            result = subprocess.run(
                ["osascript", "-e", script],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                return {
                    "source": "contacts",
                    "data": result.stdout,
                    "timestamp": datetime.datetime.now().isoformat()
                }
    except Exception as e:
        print(f"Error gathering contacts context: {e}")
    
    return None


async def gather_reminders_context(username: str) -> Optional[Dict]:
    """Gather context from Reminders app"""
    try:
        if platform.system() == "Darwin":  # macOS
            script = '''
            tell application "Reminders"
                set reminderList to {}
                repeat with reminder in reminders
                    set end of reminderList to {name:name of reminder, body:body of reminder, due_date:due date of reminder}
                end repeat
                return reminderList
            end tell
            '''
            
            result = subprocess.run(
                ["osascript", "-e", script],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                return {
                    "source": "reminders",
                    "data": result.stdout,
                    "timestamp": datetime.datetime.now().isoformat()
                }
    except Exception as e:
        print(f"Error gathering reminders context: {e}")
    
    return None


async def gather_all_app_context(username: str) -> List[Dict]:
    """Gather context from all enabled apps"""
    integrations = get_user_app_integrations(username)
    enabled_apps = integrations.get("integrated_apps", {})
    
    context_list = []
    
    # Gather context from each enabled app
    for app_id, enabled in enabled_apps.items():
        if not enabled:
            continue
        
        try:
            if app_id == "calendar":
                context = await gather_calendar_context(username)
                if context:
                    context_list.append(context)
            elif app_id == "contacts":
                context = await gather_contacts_context(username)
                if context:
                    context_list.append(context)
            elif app_id == "reminders":
                context = await gather_reminders_context(username)
                if context:
                    context_list.append(context)
            # Add more app integrations here as needed
        except Exception as e:
            print(f"Error gathering context from {app_id}: {e}")
    
    return context_list


def update_memory_with_app_context(username: str, app_context: List[Dict]):
    """Update user memory with context gathered from apps"""
    import memory_manager
    
    memory = memory_manager.load_user_memory(username)
    
    if "app_integrations" not in memory:
        memory["app_integrations"] = {}
    
    # Store app context
    for context in app_context:
        source = context.get("source", "unknown")
        if source not in memory["app_integrations"]:
            memory["app_integrations"][source] = []
        
        memory["app_integrations"][source].append({
            "data": context.get("data"),
            "timestamp": context.get("timestamp")
        })
        
        # Keep only last 50 entries per app
        if len(memory["app_integrations"][source]) > 50:
            memory["app_integrations"][source] = memory["app_integrations"][source][-50:]
    
    memory_manager.save_user_memory(username, memory)

