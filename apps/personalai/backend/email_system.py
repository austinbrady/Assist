"""
Email System - Complete email writing, sending, and management
All results are displayed in chat window
"""

import smtplib
import json
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from pathlib import Path
from typing import Dict, Optional, List
from datetime import datetime
import hashlib
import base64
from cryptography.fernet import Fernet
import os

logger = logging.getLogger(__name__)

# Encryption key for storing email passwords securely
def get_encryption_key() -> bytes:
    """Get or create encryption key for email passwords"""
    key_file = Path("email_encryption.key")
    if key_file.exists():
        return key_file.read_bytes()
    else:
        key = Fernet.generate_key()
        key_file.write_bytes(key)
        key_file.chmod(0o600)  # Secure permissions
        return key

def encrypt_password(password: str) -> str:
    """Encrypt password for storage"""
    key = get_encryption_key()
    f = Fernet(key)
    return f.encrypt(password.encode()).decode()

def decrypt_password(encrypted_password: str) -> str:
    """Decrypt password for use"""
    key = get_encryption_key()
    f = Fernet(key)
    return f.decrypt(encrypted_password.encode()).decode()

def get_user_email_config_dir(username: str) -> Path:
    """Get user-specific email configuration directory"""
    user_dir = Path("users_data") / username
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir

def save_email_config(username: str, config: Dict) -> Dict:
    """Save email configuration (encrypts password)"""
    config_dir = get_user_email_config_dir(username)
    config_file = config_dir / "email_config.json"
    
    # Encrypt password if provided
    if "password" in config and config["password"]:
        config["encrypted_password"] = encrypt_password(config["password"])
        del config["password"]
    
    config["updated_at"] = datetime.now().isoformat()
    
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    
    return config

def load_email_config(username: str) -> Optional[Dict]:
    """Load email configuration (decrypts password)"""
    config_dir = get_user_email_config_dir(username)
    config_file = config_dir / "email_config.json"
    
    if not config_file.exists():
        return None
    
    try:
        with open(config_file, 'r') as f:
            config = json.load(f)
        
        # Decrypt password if present
        if "encrypted_password" in config:
            try:
                config["password"] = decrypt_password(config["encrypted_password"])
            except Exception as e:
                logger.error(f"Failed to decrypt password: {e}")
                return None
        
        return config
    except Exception as e:
        logger.error(f"Failed to load email config: {e}")
        return None

def draft_email_from_natural_language(username: str, description: str, context: Optional[Dict] = None) -> Dict:
    """
    Generate email draft from natural language description
    Uses AI to understand intent and create email content
    """
    # This would typically use the LLM to generate email content
    # For now, return a structured draft that can be refined
    
    draft_id = f"draft_{datetime.now().timestamp()}"
    
    # Parse description for common patterns
    description_lower = description.lower()
    
    # Extract recipient
    recipient = None
    if "to" in description_lower:
        # Simple extraction - in production, use NLP
        parts = description_lower.split("to")
        if len(parts) > 1:
            recipient_part = parts[1].split()[0] if parts[1].split() else None
            if recipient_part and "@" in recipient_part:
                recipient = recipient_part
    
    # Extract subject hints
    subject = "Email"
    if "about" in description_lower:
        parts = description_lower.split("about")
        if len(parts) > 1:
            subject = parts[1].strip().capitalize()
    
    # Generate draft structure
    draft = {
        "draft_id": draft_id,
        "to": recipient or "",
        "subject": subject,
        "body": f"Hi,\n\n{description}\n\nBest regards",
        "created_at": datetime.now().isoformat(),
        "status": "draft"
    }
    
    # Save draft
    config_dir = get_user_email_config_dir(username)
    drafts_dir = config_dir / "email_drafts"
    drafts_dir.mkdir(exist_ok=True)
    
    draft_file = drafts_dir / f"{draft_id}.json"
    with open(draft_file, 'w') as f:
        json.dump(draft, f, indent=2)
    
    return draft

def send_email(username: str, to: str, subject: str, body: str, 
               html_body: Optional[str] = None, attachments: Optional[List[str]] = None) -> Dict:
    """
    Send email via SMTP
    Returns result for display in chat
    """
    config = load_email_config(username)
    
    if not config:
        return {
            "success": False,
            "error": "Email not configured. Please configure your email settings first."
        }
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = config.get("from_email", config.get("email"))
        msg['To'] = to
        msg['Subject'] = subject
        
        # Add text and HTML parts
        if html_body:
            part1 = MIMEText(body, 'plain')
            part2 = MIMEText(html_body, 'html')
            msg.attach(part1)
            msg.attach(part2)
        else:
            msg.attach(MIMEText(body, 'plain'))
        
        # Add attachments if provided
        if attachments:
            for attachment_path in attachments:
                if os.path.exists(attachment_path):
                    with open(attachment_path, 'rb') as f:
                        part = MIMEBase('application', 'octet-stream')
                        part.set_payload(f.read())
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {os.path.basename(attachment_path)}'
                    )
                    msg.attach(part)
        
        # Connect to SMTP server
        smtp_host = config.get("smtp_host", "smtp.gmail.com")
        smtp_port = config.get("smtp_port", 587)
        smtp_user = config.get("email")
        smtp_password = config.get("password")
        
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        # Log sent email
        log_sent_email(username, to, subject, body)
        
        return {
            "success": True,
            "message": f"Email sent to {to}",
            "to": to,
            "subject": subject,
            "sent_at": datetime.now().isoformat()
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
        logger.error(f"Error sending email: {e}")
        return {
            "success": False,
            "error": f"Failed to send email: {str(e)}"
        }

def log_sent_email(username: str, to: str, subject: str, body: str):
    """Log sent email for history"""
    config_dir = get_user_email_config_dir(username)
    sent_dir = config_dir / "sent_emails"
    sent_dir.mkdir(exist_ok=True)
    
    email_log = {
        "to": to,
        "subject": subject,
        "body": body,
        "sent_at": datetime.now().isoformat()
    }
    
    log_file = sent_dir / f"email_{datetime.now().timestamp()}.json"
    with open(log_file, 'w') as f:
        json.dump(email_log, f, indent=2)

def get_email_history(username: str, limit: int = 10) -> List[Dict]:
    """Get email history for user"""
    config_dir = get_user_email_config_dir(username)
    sent_dir = config_dir / "sent_emails"
    
    if not sent_dir.exists():
        return []
    
    emails = []
    for email_file in sorted(sent_dir.glob("email_*.json"), reverse=True)[:limit]:
        try:
            with open(email_file, 'r') as f:
                emails.append(json.load(f))
        except Exception:
            continue
    
    return emails

def get_email_draft(username: str, draft_id: str) -> Optional[Dict]:
    """Get email draft by ID"""
    config_dir = get_user_email_config_dir(username)
    drafts_dir = config_dir / "email_drafts"
    draft_file = drafts_dir / f"{draft_id}.json"
    
    if not draft_file.exists():
        return None
    
    try:
        with open(draft_file, 'r') as f:
            return json.load(f)
    except Exception:
        return None
