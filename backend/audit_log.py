"""
User Activity Audit Log System
Tracks all user activities locally for privacy and security
"""
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

AUDIT_LOG_DIR = Path("users")
AUDIT_LOG_DIR.mkdir(exist_ok=True)
AUDIT_LOG_FILE = AUDIT_LOG_DIR / "audit_log.json"


def load_audit_log() -> List[Dict]:
    """Load audit log from file"""
    if AUDIT_LOG_FILE.exists():
        try:
            with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []


def save_audit_log(log: List[Dict]):
    """Save audit log to file"""
    try:
        with open(AUDIT_LOG_FILE, "w", encoding="utf-8") as f:
            json.dump(log, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving audit log: {e}")


def log_user_activity(username: str, action: str, details: Optional[Dict] = None):
    """
    Log user activity for audit trail
    
    Actions tracked:
    - account_created: User account created
    - account_login: User logged in
    - wallet_created: Wallet generated for user
    - wallet_regenerated: Wallet regenerated
    - wallet_downloaded: Wallet JSON downloaded
    - image_uploaded: Image file uploaded
    - image_generated: Image generated via AI
    - image_edited: Image edited
    - video_uploaded: Video file uploaded
    - video_generated: Video generated via AI
    - video_edited: Video edited
    - song_generated: Song generated
    - conversation_created: New conversation started
    - conversation_deleted: Conversation deleted
    - profile_updated: User profile updated
    - assistant_selected: AI assistant selected
    - skill_executed: AI skill executed
    """
    log = load_audit_log()
    log_entry = {
        "username": username,
        "action": action,
        "timestamp": datetime.now().isoformat(),
        "details": details or {}
    }
    log.append(log_entry)
    
    # Keep only last 10,000 entries to prevent log from growing too large
    if len(log) > 10000:
        log = log[-10000:]
    
    save_audit_log(log)


def get_user_audit_log(username: str, limit: int = 100) -> List[Dict]:
    """Get audit log entries for a specific user"""
    log = load_audit_log()
    user_entries = [entry for entry in log if entry.get("username") == username]
    # Return most recent entries first
    user_entries.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return user_entries[:limit]


def get_all_audit_log(limit: int = 1000) -> List[Dict]:
    """Get all audit log entries (for admin/debugging)"""
    log = load_audit_log()
    # Return most recent entries first
    log.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return log[:limit]

