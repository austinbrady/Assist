"""
Things 3 Integration Module
Sends tasks to Things 3 via email inbox integration

Things 3 allows users to set up an inbox email address where emails automatically become tasks.
This module formats tasks properly for Things 3 and sends them via SMTP.

Reference: https://culturedcode.com/things/support/articles/2982272/
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict
from datetime import datetime
import json
from pathlib import Path

logger = logging.getLogger(__name__)


def get_user_settings_dir(username: str) -> Path:
    """Get user-specific settings directory"""
    user_dir = Path("users_data") / username
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir


def load_things3_settings(username: str) -> Dict:
    """Load Things 3 settings for a user"""
    settings_file = get_user_settings_dir(username) / "things3_settings.json"
    if settings_file.exists():
        try:
            with open(settings_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading Things 3 settings: {e}")
    return {}


def save_things3_settings(username: str, settings: Dict):
    """Save Things 3 settings for a user"""
    settings_file = get_user_settings_dir(username) / "things3_settings.json"
    try:
        with open(settings_file, 'w') as f:
            json.dump(settings, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving Things 3 settings: {e}")
        raise


def format_task_for_things3(task: str, priority: str = "medium", due_date: Optional[str] = None, 
                            category: Optional[str] = None, notes: Optional[str] = None) -> str:
    """
    Format a task for Things 3 email inbox
    
    Things 3 email format:
    - Subject line becomes the task title
    - Body can contain notes
    - Special formatting can be used for dates, tags, etc.
    
    Things 3 supports:
    - Due dates in subject: "Task @due(2024-12-31)"
    - Tags: "Task #tag"
    - Projects: "Task /Project Name"
    - Areas: "Task /Area Name/Project Name"
    """
    formatted_task = task
    
    # Add due date if provided
    if due_date:
        try:
            # Parse and format date for Things 3
            # Things 3 accepts dates in various formats
            # Format: @due(YYYY-MM-DD) or @due(today) or @due(tomorrow)
            if due_date.lower() in ["today", "tomorrow"]:
                formatted_task = f"{formatted_task} @due({due_date.lower()})"
            else:
                # Try to parse ISO format or other common formats
                formatted_task = f"{formatted_task} @due({due_date})"
        except Exception:
            # If date parsing fails, just append it as text
            formatted_task = f"{formatted_task} (Due: {due_date})"
    
    # Add priority indicator (Things 3 uses tags for priority)
    if priority == "high":
        formatted_task = f"{formatted_task} #important"
    elif priority == "low":
        formatted_task = f"{formatted_task} #low-priority"
    
    # Add category as tag if provided
    if category:
        # Clean category name for Things 3 tag format (no spaces, lowercase)
        tag = category.lower().replace(" ", "-")
        formatted_task = f"{formatted_task} #{tag}"
    
    # Add notes in body if provided
    body = ""
    if notes:
        body = notes
    
    return formatted_task, body


def send_task_to_things3(username: str, task: str, priority: str = "medium", 
                         due_date: Optional[str] = None, category: Optional[str] = None,
                         notes: Optional[str] = None) -> Dict:
    """
    Send a task to Things 3 inbox via email
    
    Returns:
        Dict with status and message
    """
    settings = load_things3_settings(username)
    
    # Check if Things 3 is configured
    things3_email = settings.get("inbox_email")
    if not things3_email:
        return {
            "success": False,
            "error": "Things 3 inbox email not configured. Please set your Things 3 inbox email in settings."
        }
    
    # Get SMTP settings (user can configure their own SMTP or we use a default)
    smtp_host = settings.get("smtp_host", "smtp.gmail.com")
    smtp_port = settings.get("smtp_port", 587)
    smtp_user = settings.get("smtp_user")
    smtp_password = settings.get("smtp_password")
    from_email = settings.get("from_email", smtp_user)
    
    # If no SMTP credentials, we can't send
    if not smtp_user or not smtp_password:
        return {
            "success": False,
            "error": "SMTP credentials not configured. Please configure email settings to use Things 3 integration."
        }
    
    try:
        # Format task for Things 3
        formatted_task, body = format_task_for_things3(task, priority, due_date, category, notes)
        
        # Create email
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = things3_email
        msg['Subject'] = formatted_task
        
        if body:
            msg.attach(MIMEText(body, 'plain'))
        
        # Send email via SMTP
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        logger.info(f"Task sent to Things 3 inbox: {formatted_task}")
        
        return {
            "success": True,
            "message": f"Task '{task}' sent to Things 3 inbox successfully",
            "formatted_task": formatted_task
        }
        
    except smtplib.SMTPAuthenticationError:
        return {
            "success": False,
            "error": "SMTP authentication failed. Please check your email credentials."
        }
    except smtplib.SMTPException as e:
        return {
            "success": False,
            "error": f"SMTP error: {str(e)}"
        }
    except Exception as e:
        logger.error(f"Error sending task to Things 3: {e}")
        return {
            "success": False,
            "error": f"Failed to send task to Things 3: {str(e)}"
        }


def is_things3_configured(username: str) -> bool:
    """Check if Things 3 is configured for a user"""
    settings = load_things3_settings(username)
    return bool(settings.get("inbox_email") and settings.get("smtp_user") and settings.get("smtp_password"))

