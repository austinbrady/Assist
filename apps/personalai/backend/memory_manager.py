"""
Memory Manager - Persistent memory system for user conversations
Stores important information from deleted conversations so the agent remembers context
PRIVATE & ENCRYPTED: Memory file is encrypted and hidden for privacy
"""
import json
import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import httpx
import os
import base64
import hashlib
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# User memory directory structure: users_data/{username}/.personalai_memory (hidden encrypted file)
MEMORY_DIR = Path("users_data")

def get_encryption_key(username: str) -> bytes:
    """Generate encryption key from username and system secret"""
    # Use a combination of username and system secret for key derivation
    system_secret = os.getenv("PERSONALAI_MEMORY_SECRET", "personalai-secret-memory-key-2024")
    password = f"{username}:{system_secret}".encode()
    salt = hashlib.sha256(f"personalai:{username}".encode()).digest()[:16]
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password))
    return key

def get_memory_file(username: str) -> Path:
    """Get the encrypted, hidden memory file path for a user"""
    user_dir = MEMORY_DIR / username
    user_dir.mkdir(parents=True, exist_ok=True)
    # Hidden file (dotfile) - .personalai_memory
    return user_dir / ".personalai_memory"


def load_user_memory(username: str) -> Dict:
    """Load user's persistent memory from encrypted, hidden file"""
    memory_file = get_memory_file(username)
    
    if not memory_file.exists():
        return {
            "username": username,
            "created_at": datetime.datetime.now().isoformat(),
            "conversation_summaries": [],
            "important_facts": [],
            "user_preferences": {},
            "recent_activities": [],
            "skill_usage_history": [],
            "app_integrations": {},
            "user_insights": {},
            "updated_at": datetime.datetime.now().isoformat()
        }
    
    try:
        # Read encrypted file
        with open(memory_file, "rb") as f:
            encrypted_data = f.read()
        
        if not encrypted_data:
            raise ValueError("Empty encrypted file")
        
        # Decrypt
        key = get_encryption_key(username)
        fernet = Fernet(key)
        decrypted_data = fernet.decrypt(encrypted_data)
        
        # Parse JSON
        memory = json.loads(decrypted_data.decode('utf-8'))
        return memory
    except Exception as e:
        print(f"Error loading encrypted memory (returning default): {e}")
        # Return default memory if file is corrupted or decryption fails
        return {
            "username": username,
            "created_at": datetime.datetime.now().isoformat(),
            "conversation_summaries": [],
            "important_facts": [],
            "user_preferences": {},
            "recent_activities": [],
            "skill_usage_history": [],
            "app_integrations": {},
            "user_insights": {},
            "updated_at": datetime.datetime.now().isoformat()
        }


def save_user_memory(username: str, memory: Dict):
    """Save user's persistent memory to encrypted, hidden file"""
    memory_file = get_memory_file(username)
    memory["updated_at"] = datetime.datetime.now().isoformat()
    
    try:
        # Convert to JSON
        json_data = json.dumps(memory, indent=2, ensure_ascii=False)
        
        # Encrypt
        key = get_encryption_key(username)
        fernet = Fernet(key)
        encrypted_data = fernet.encrypt(json_data.encode('utf-8'))
        
        # Write encrypted file (hidden dotfile)
        with open(memory_file, "wb") as f:
            f.write(encrypted_data)
        
        # Make file hidden (set hidden attribute on systems that support it)
        try:
            if os.name == 'nt':  # Windows
                import ctypes
                ctypes.windll.kernel32.SetFileAttributesW(str(memory_file), 0x02)  # FILE_ATTRIBUTE_HIDDEN
            # On Unix systems, dotfiles are already hidden
        except Exception:
            pass  # Ignore if setting hidden attribute fails
    except Exception as e:
        print(f"Error saving encrypted memory: {e}")


async def extract_conversation_summary(conversation: Dict, ollama_base_url: str = "http://localhost:11434") -> Dict:
    """
    Extract important information from a conversation before deletion
    Uses AI to summarize key points, facts, preferences, and context
    """
    try:
        messages = conversation.get("messages", [])
        if not messages:
            return None
        
        # Combine conversation messages into text
        conversation_text = "\n".join([
            f"{msg.get('role', 'unknown')}: {msg.get('content', '')}"
            for msg in messages
        ])
        
        # Create summary prompt for AI
        summary_prompt = f"""Analyze this conversation and extract:

1. IMPORTANT FACTS: Key facts, information, or context mentioned (user's name, preferences, situations, etc.)
2. USER PREFERENCES: What the user likes/dislikes, preferences, habits, communication style
3. CONVERSATION SUMMARY: A brief summary of what was discussed and any important topics
4. SKILLS USED: Any skills or actions that were executed
5. KEY CONTEXT: Important context that should be remembered for future conversations

Conversation:
{conversation_text}

Return ONLY a valid JSON object with these exact fields:
{{
    "important_facts": ["fact1", "fact2"],
    "user_preferences": {{"preference_key": "preference_value"}},
    "conversation_summary": "brief summary",
    "skills_used": ["skill1", "skill2"],
    "key_context": "important context to remember"
}}"""
        
        # Call Ollama to generate summary
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{ollama_base_url}/api/chat",
                json={
                    "model": "llama3:latest",
                    "messages": [
                        {"role": "system", "content": "You are a helpful assistant that extracts key information from conversations. Always return valid JSON only."},
                        {"role": "user", "content": summary_prompt}
                    ],
                    "stream": False
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result.get("message", {}).get("content", "")
                # Try to extract JSON from response
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    summary_data = json.loads(json_match.group())
                else:
                    summary_data = None
            else:
                summary_data = None
        
        if summary_data:
            return {
                "conversation_id": conversation.get("conversation_id"),
                "created_at": conversation.get("created_at"),
                "deleted_at": datetime.datetime.now().isoformat(),
                "important_facts": summary_data.get("important_facts", []),
                "user_preferences": summary_data.get("user_preferences", {}),
                "conversation_summary": summary_data.get("conversation_summary", ""),
                "skills_used": summary_data.get("skills_used", []),
                "key_context": summary_data.get("key_context", "")
            }
        
    except Exception as e:
        print(f"Error extracting conversation summary: {e}")
    
    # Fallback: create basic summary from conversation
    messages = conversation.get("messages", [])
    if messages:
        user_messages = [msg.get("content", "") for msg in messages if msg.get("role") == "user"]
        return {
            "conversation_id": conversation.get("conversation_id"),
            "created_at": conversation.get("created_at"),
            "deleted_at": datetime.datetime.now().isoformat(),
            "important_facts": [],
            "user_preferences": {},
            "conversation_summary": f"Conversation with {len(messages)} messages. Topics: {', '.join(user_messages[:3])}",
            "skills_used": [],
            "key_context": ""
        }
    
    return None


def add_conversation_summary_to_memory(username: str, summary: Dict):
    """Add a conversation summary to user's memory"""
    memory = load_user_memory(username)
    
    # Add summary to conversation summaries
    memory["conversation_summaries"].append(summary)
    
    # Keep only last 50 summaries to prevent memory file from growing too large
    if len(memory["conversation_summaries"]) > 50:
        memory["conversation_summaries"] = memory["conversation_summaries"][-50:]
    
    # Merge important facts (deduplicate)
    new_facts = summary.get("important_facts", [])
    existing_facts = memory.get("important_facts", [])
    for fact in new_facts:
        if fact not in existing_facts:
            memory["important_facts"].append(fact)
    
    # Keep only last 100 facts
    if len(memory["important_facts"]) > 100:
        memory["important_facts"] = memory["important_facts"][-100:]
    
    # Merge user preferences
    new_preferences = summary.get("user_preferences", {})
    existing_preferences = memory.get("user_preferences", {})
    existing_preferences.update(new_preferences)
    memory["user_preferences"] = existing_preferences
    
    # Add skills used to history
    skills_used = summary.get("skills_used", [])
    for skill in skills_used:
        if skill not in memory.get("skill_usage_history", []):
            memory.setdefault("skill_usage_history", []).append({
                "skill": skill,
                "first_used": datetime.datetime.now().isoformat(),
                "last_used": datetime.datetime.now().isoformat(),
                "usage_count": 1
            })
        else:
            # Update existing skill
            for skill_entry in memory["skill_usage_history"]:
                if skill_entry["skill"] == skill:
                    skill_entry["last_used"] = datetime.datetime.now().isoformat()
                    skill_entry["usage_count"] = skill_entry.get("usage_count", 0) + 1
                    break
    
    save_user_memory(username, memory)


def log_user_activity(username: str, activity_type: str, activity_data: Dict):
    """Log ALL user activity to memory for context - constantly updated based on everything user does"""
    memory = load_user_memory(username)
    
    activity = {
        "type": activity_type,
        "data": activity_data,
        "timestamp": datetime.datetime.now().isoformat()
    }
    
    memory.setdefault("recent_activities", []).append(activity)
    
    # Keep last 500 activities (expanded from 100 to capture more history)
    if len(memory["recent_activities"]) > 500:
        memory["recent_activities"] = memory["recent_activities"][-500:]
    
    # Auto-update user insights based on activity patterns
    update_user_insights(username, memory, activity)
    
    save_user_memory(username, memory)


def update_user_insights(username: str, memory: Dict, activity: Dict):
    """Automatically update user insights based on activity patterns"""
    activity_type = activity.get("type", "")
    activity_data = activity.get("data", {})
    
    # Initialize insights if not present
    if "user_insights" not in memory:
        memory["user_insights"] = {}
    
    insights = memory["user_insights"]
    
    # Track skill usage patterns
    if activity_type == "skill_executed":
        skill_id = activity_data.get("skill_id", "")
        if skill_id:
            if "frequent_skills" not in insights:
                insights["frequent_skills"] = {}
            insights["frequent_skills"][skill_id] = insights["frequent_skills"].get(skill_id, 0) + 1
    
    # Track conversation topics
    if activity_type == "chat_message":
        message_length = activity_data.get("message_length", 0)
        if "avg_message_length" not in insights:
            insights["avg_message_length"] = []
        insights["avg_message_length"].append(message_length)
        # Keep last 100 message lengths
        if len(insights["avg_message_length"]) > 100:
            insights["avg_message_length"] = insights["avg_message_length"][-100:]
    
    # Track activity frequency
    if "activity_frequency" not in insights:
        insights["activity_frequency"] = {}
    insights["activity_frequency"][activity_type] = insights["activity_frequency"].get(activity_type, 0) + 1


def get_memory_context_for_prompt(username: str) -> str:
    """Get formatted memory context to include in system prompts"""
    memory = load_user_memory(username)
    
    if not any([
        memory.get("conversation_summaries"),
        memory.get("important_facts"),
        memory.get("user_preferences"),
        memory.get("recent_activities")
    ]):
        return ""
    
    context_parts = []
    
    # Important facts
    important_facts = memory.get("important_facts", [])
    if important_facts:
        context_parts.append(f"IMPORTANT FACTS ABOUT USER:\n- " + "\n- ".join(important_facts[-10:]))  # Last 10 facts
    
    # User preferences
    preferences = memory.get("user_preferences", {})
    if preferences:
        prefs_text = "\n".join([f"- {k}: {v}" for k, v in list(preferences.items())[-10:]])
        context_parts.append(f"USER PREFERENCES:\n{prefs_text}")
    
    # Recent conversation summaries
    summaries = memory.get("conversation_summaries", [])
    if summaries:
        recent_summaries = summaries[-5:]  # Last 5 summaries
        summaries_text = "\n".join([
            f"- {s.get('conversation_summary', '')}" 
            for s in recent_summaries if s.get("conversation_summary")
        ])
        if summaries_text:
            context_parts.append(f"RECENT CONVERSATION CONTEXT:\n{summaries_text}")
    
    # Recent activities
    activities = memory.get("recent_activities", [])
    if activities:
        recent_activities = activities[-10:]  # Last 10 activities
        activities_text = "\n".join([
            f"- {a.get('type', '')}: {a.get('data', {})}" 
            for a in recent_activities
        ])
        if activities_text:
            context_parts.append(f"RECENT USER ACTIVITIES:\n{activities_text}")
    
    # App integration context
    app_integrations = memory.get("app_integrations", {})
    if app_integrations:
        app_context_text = []
        for app_name, app_data in app_integrations.items():
            if app_data:
                latest_data = app_data[-1] if isinstance(app_data, list) else app_data
                app_context_text.append(f"- {app_name}: {latest_data.get('data', '')[:200]}")
        if app_context_text:
            context_parts.append(f"APP INTEGRATION CONTEXT:\n" + "\n".join(app_context_text))
    
    # User insights
    insights = memory.get("user_insights", {})
    if insights:
        insights_text = []
        if "frequent_skills" in insights:
            top_skills = sorted(insights["frequent_skills"].items(), key=lambda x: x[1], reverse=True)[:5]
            skills_text = ", ".join([f"{skill}({count})" for skill, count in top_skills])
            insights_text.append(f"Most used skills: {skills_text}")
        if insights_text:
            context_parts.append(f"USER INSIGHTS:\n" + "\n".join(insights_text))
    
    if context_parts:
        return "\n\n".join(["PERSISTENT MEMORY (remember these from past conversations and app integrations):"] + context_parts)
    
    return ""

