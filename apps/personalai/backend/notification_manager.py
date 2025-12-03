"""
Notification Manager - Stores and retrieves notifications for users
Notifications are stored per-user in JSON files
"""

import json
import os
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
import uuid

NOTIFICATIONS_DIR = Path(__file__).parent / "notifications"

def ensure_notifications_dir():
    """Ensure notifications directory exists"""
    NOTIFICATIONS_DIR.mkdir(parents=True, exist_ok=True)

def get_user_notifications_file(username: str) -> Path:
    """Get the notifications file for a user"""
    ensure_notifications_dir()
    return NOTIFICATIONS_DIR / f"{username}_notifications.json"

def add_notification(
    username: str,
    notification_type: str,
    title: str,
    message: str,
    file_url: Optional[str] = None,
    file_path: Optional[str] = None
) -> Dict:
    """Add a notification for a user"""
    notifications_file = get_user_notifications_file(username)
    
    # Load existing notifications
    notifications = []
    if notifications_file.exists():
        try:
            with open(notifications_file, 'r', encoding='utf-8') as f:
                notifications = json.load(f)
        except Exception:
            notifications = []
    
    # Add new notification
    notification = {
        "id": str(uuid.uuid4()),
        "type": notification_type,
        "title": title,
        "message": message,
        "fileUrl": file_url,
        "filePath": file_path,
        "timestamp": datetime.now().isoformat(),
        "read": False
    }
    
    notifications.insert(0, notification)  # Add to beginning
    
    # Keep only last 100 notifications
    notifications = notifications[:100]
    
    # Save notifications
    with open(notifications_file, 'w', encoding='utf-8') as f:
        json.dump(notifications, f, indent=2, ensure_ascii=False)
    
    return notification

def get_notifications(username: str, unread_only: bool = False) -> List[Dict]:
    """Get notifications for a user"""
    notifications_file = get_user_notifications_file(username)
    
    if not notifications_file.exists():
        return []
    
    try:
        with open(notifications_file, 'r', encoding='utf-8') as f:
            notifications = json.load(f)
        
        if unread_only:
            notifications = [n for n in notifications if not n.get('read', False)]
        
        return notifications
    except Exception:
        return []

def mark_notification_read(username: str, notification_id: str):
    """Mark a notification as read"""
    notifications_file = get_user_notifications_file(username)
    
    if not notifications_file.exists():
        return
    
    try:
        with open(notifications_file, 'r', encoding='utf-8') as f:
            notifications = json.load(f)
        
        for notification in notifications:
            if notification.get('id') == notification_id:
                notification['read'] = True
                break
        
        with open(notifications_file, 'w', encoding='utf-8') as f:
            json.dump(notifications, f, indent=2, ensure_ascii=False)
    except Exception:
        pass

def delete_notification(username: str, notification_id: str) -> bool:
    """Delete a notification"""
    notifications_file = get_user_notifications_file(username)
    
    if not notifications_file.exists():
        return False
    
    try:
        with open(notifications_file, 'r', encoding='utf-8') as f:
            notifications = json.load(f)
        
        notifications = [n for n in notifications if n.get('id') != notification_id]
        
        with open(notifications_file, 'w', encoding='utf-8') as f:
            json.dump(notifications, f, indent=2, ensure_ascii=False)
        
        return True
    except Exception:
        return False

def clear_notifications(username: str):
    """Clear all notifications for a user"""
    notifications_file = get_user_notifications_file(username)
    
    if notifications_file.exists():
        try:
            notifications_file.unlink()
        except Exception:
            pass

