"""
Phone System - Make phone calls, schedule calls, manage call history
All results are displayed in chat window
"""

import json
import logging
from pathlib import Path
from typing import Dict, Optional, List
from datetime import datetime, timedelta
import os

logger = logging.getLogger(__name__)

# Try to import Twilio
try:
    from twilio.rest import Client
    from twilio.base.exceptions import TwilioException
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    logger.warning("Twilio not available. Install twilio package for phone call functionality.")

def get_user_phone_dir(username: str) -> Path:
    """Get user-specific phone data directory"""
    user_dir = Path("users_data") / username
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir

def get_twilio_client() -> Optional[Client]:
    """Get Twilio client from environment variables"""
    if not TWILIO_AVAILABLE:
        return None
    
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    
    if not account_sid or not auth_token:
        return None
    
    return Client(account_sid, auth_token)

def make_phone_call(username: str, to_phone: str, from_phone: Optional[str] = None) -> Dict:
    """
    Make a phone call via Twilio
    Returns result for display in chat
    """
    if not TWILIO_AVAILABLE:
        return {
            "success": False,
            "error": "Twilio not available. Please install twilio package and configure credentials."
        }
    
    client = get_twilio_client()
    if not client:
        return {
            "success": False,
            "error": "Twilio not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables."
        }
    
    # Get user's phone number from config or use default
    if not from_phone:
        from_phone = os.getenv("TWILIO_PHONE_NUMBER")
        if not from_phone:
            return {
                "success": False,
                "error": "No phone number configured. Please set TWILIO_PHONE_NUMBER or provide from_phone."
            }
    
    try:
        # Make the call
        call = client.calls.create(
            to=to_phone,
            from_=from_phone,
            url=os.getenv("TWILIO_CALLBACK_URL", "http://demo.twilio.com/docs/voice.xml")  # Default Twilio demo
        )
        
        # Log the call
        call_data = {
            "call_id": call.sid,
            "to": to_phone,
            "from": from_phone,
            "status": call.status,
            "created_at": datetime.now().isoformat(),
            "twilio_sid": call.sid
        }
        
        log_call(username, call_data)
        
        return {
            "success": True,
            "call_id": call.sid,
            "to": to_phone,
            "from": from_phone,
            "status": call.status,
            "message": f"Calling {to_phone}...",
            "created_at": datetime.now().isoformat()
        }
        
    except TwilioException as e:
        logger.error(f"Twilio error: {e}")
        return {
            "success": False,
            "error": f"Failed to make call: {str(e)}"
        }
    except Exception as e:
        logger.error(f"Error making phone call: {e}")
        return {
            "success": False,
            "error": f"Failed to make call: {str(e)}"
        }

def schedule_call(username: str, to_phone: str, scheduled_time: str, 
                 from_phone: Optional[str] = None, notes: Optional[str] = None) -> Dict:
    """
    Schedule a phone call for later
    Returns result for display in chat
    """
    try:
        scheduled_datetime = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
    except Exception:
        return {
            "success": False,
            "error": "Invalid scheduled_time format. Use ISO 8601 format."
        }
    
    # Store scheduled call
    phone_dir = get_user_phone_dir(username)
    scheduled_dir = phone_dir / "scheduled_calls"
    scheduled_dir.mkdir(exist_ok=True)
    
    call_id = f"call_{datetime.now().timestamp()}"
    scheduled_call = {
        "call_id": call_id,
        "to": to_phone,
        "from": from_phone or os.getenv("TWILIO_PHONE_NUMBER"),
        "scheduled_time": scheduled_time,
        "notes": notes,
        "status": "scheduled",
        "created_at": datetime.now().isoformat()
    }
    
    call_file = scheduled_dir / f"{call_id}.json"
    with open(call_file, 'w') as f:
        json.dump(scheduled_call, f, indent=2)
    
    return {
        "success": True,
        "call_id": call_id,
        "to": to_phone,
        "scheduled_time": scheduled_time,
        "status": "scheduled",
        "message": f"Call scheduled to {to_phone} for {scheduled_time}",
        "created_at": datetime.now().isoformat()
    }

def log_call(username: str, call_data: Dict):
    """Log call to history"""
    phone_dir = get_user_phone_dir(username)
    history_dir = phone_dir / "call_history"
    history_dir.mkdir(exist_ok=True)
    
    call_file = history_dir / f"call_{call_data['call_id']}.json"
    with open(call_file, 'w') as f:
        json.dump(call_data, f, indent=2)

def get_call_history(username: str, limit: int = 20) -> List[Dict]:
    """Get call history for user"""
    phone_dir = get_user_phone_dir(username)
    history_dir = phone_dir / "call_history"
    
    if not history_dir.exists():
        return []
    
    calls = []
    for call_file in sorted(history_dir.glob("call_*.json"), reverse=True)[:limit]:
        try:
            with open(call_file, 'r') as f:
                calls.append(json.load(f))
        except Exception:
            continue
    
    return calls

def get_scheduled_calls(username: str) -> List[Dict]:
    """Get scheduled calls for user"""
    phone_dir = get_user_phone_dir(username)
    scheduled_dir = phone_dir / "scheduled_calls"
    
    if not scheduled_dir.exists():
        return []
    
    scheduled_calls = []
    for call_file in scheduled_dir.glob("call_*.json"):
        try:
            with open(call_file, 'r') as f:
                call_data = json.load(f)
                # Only return future scheduled calls
                scheduled_time = datetime.fromisoformat(call_data.get("scheduled_time", "").replace('Z', '+00:00'))
                if scheduled_time > datetime.now(scheduled_time.tzinfo):
                    scheduled_calls.append(call_data)
        except Exception:
            continue
    
    # Sort by scheduled time
    scheduled_calls.sort(key=lambda x: x.get("scheduled_time", ""))
    return scheduled_calls

def cancel_scheduled_call(username: str, call_id: str) -> Dict:
    """Cancel a scheduled call"""
    phone_dir = get_user_phone_dir(username)
    scheduled_dir = phone_dir / "scheduled_calls"
    call_file = scheduled_dir / f"{call_id}.json"
    
    if not call_file.exists():
        return {
            "success": False,
            "error": "Scheduled call not found"
        }
    
    try:
        call_file.unlink()
        return {
            "success": True,
            "message": "Scheduled call cancelled"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to cancel call: {str(e)}"
        }
