"""
User Authentication and AI Assistant Management
"""
import json
import hashlib
import secrets
from pathlib import Path
from typing import Optional, Dict, List, Tuple
from datetime import datetime
from passlib.context import CryptContext
import bcrypt

# Use bcrypt directly to avoid passlib initialization issues
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

USERS_DIR = Path("users")
USERS_DIR.mkdir(exist_ok=True)
USERS_FILE = USERS_DIR / "users.json"
USERNAME_LOG_FILE = USERS_DIR / "username_log.json"  # Audit log of all usernames

# 7 Biblical AI Assistants with anime-style personas
BIBLICAL_ASSISTANTS = [
    {
        "id": "michael",
        "name": "Michael",
        "biblical_reference": "Archangel Michael - Leader of Heaven's armies",
        "personality": "A noble and protective guardian. Strong, decisive, and always ready to help. Speaks with authority and wisdom, like a trusted commander.",
        "color": "#4A90E2",  # Blue
        "avatar_style": "anime warrior with blue armor, wings, and a sword"
    },
    {
        "id": "gabriel",
        "name": "Gabriel",
        "biblical_reference": "Archangel Gabriel - Messenger of God",
        "personality": "A clear and articulate communicator. Helpful, informative, and precise. Speaks with clarity and purpose, like a wise messenger.",
        "color": "#FFD700",  # Gold
        "avatar_style": "anime messenger with golden robes, scroll, and gentle expression"
    },
    {
        "id": "raphael",
        "name": "Raphael",
        "biblical_reference": "Archangel Raphael - The Healer",
        "personality": "A compassionate and healing presence. Kind, empathetic, and nurturing. Speaks with warmth and care, like a gentle healer.",
        "color": "#50C878",  # Green
        "avatar_style": "anime healer with green robes, staff, and peaceful expression"
    },
    {
        "id": "uriel",
        "name": "Uriel",
        "biblical_reference": "Archangel Uriel - The Light of God",
        "personality": "An illuminating and insightful guide. Wise, enlightening, and analytical. Speaks with clarity and insight, like a brilliant scholar.",
        "color": "#FF6B35",  # Orange
        "avatar_style": "anime scholar with orange robes, book, and glowing aura"
    },
    {
        "id": "ariel",
        "name": "Ariel",
        "biblical_reference": "Archangel Ariel - Lion of God",
        "personality": "A bold and courageous companion. Brave, determined, and fiercely loyal. Speaks with strength and conviction, like a noble warrior.",
        "color": "#C41E3A",  # Red
        "avatar_style": "anime warrior with red armor, lion features, and fierce expression"
    },
    {
        "id": "jophiel",
        "name": "Jophiel",
        "biblical_reference": "Archangel Jophiel - Beauty of God",
        "personality": "A creative and artistic guide. Inspiring, elegant, and appreciative of beauty. Speaks with grace and creativity, like an artist.",
        "color": "#9B59B6",  # Purple
        "avatar_style": "anime artist with purple robes, paintbrush, and elegant expression"
    },
    {
        "id": "chamuel",
        "name": "Chamuel",
        "biblical_reference": "Archangel Chamuel - He Who Seeks God",
        "personality": "A peaceful and loving guide. Gentle, understanding, and deeply caring. Speaks with love and patience, like a wise friend.",
        "color": "#FF69B4",  # Pink
        "avatar_style": "anime guide with pink robes, heart symbol, and gentle expression"
    }
]


def load_users() -> Dict:
    """Load users from JSON file"""
    if USERS_FILE.exists():
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_users(users: Dict):
    """Save users to JSON file"""
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2, ensure_ascii=False)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt directly"""
    # Use bcrypt directly to avoid passlib initialization issues
    password_bytes = password.encode('utf-8')
    # Bcrypt has 72-byte limit, hash with SHA256 first if longer
    if len(password_bytes) > 72:
        import hashlib
        password_hash = hashlib.sha256(password_bytes).digest()  # 32 bytes
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_hash, salt)
        return hashed.decode('utf-8')
    else:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password using bcrypt directly"""
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        
        # If password is longer than 72 bytes, hash it first
        if len(password_bytes) > 72:
            import hashlib
            password_hash = hashlib.sha256(password_bytes).digest()
            return bcrypt.checkpw(password_hash, hashed_bytes)
        else:
            return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def load_username_log() -> List[Dict]:
    """Load username audit log"""
    if USERNAME_LOG_FILE.exists():
        try:
            with open(USERNAME_LOG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []


def save_username_log(log: List[Dict]):
    """Save username audit log"""
    with open(USERNAME_LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(log, f, indent=2, ensure_ascii=False)


def log_username(username: str, action: str = "created"):
    """Log username activity for audit trail"""
    log = load_username_log()
    log.append({
        "username": username,
        "action": action,
        "timestamp": datetime.now().isoformat()
    })
    save_username_log(log)


def is_username_taken(username: str) -> bool:
    """Check if username is already taken (case-insensitive)"""
    users = load_users()
    username_normalized = username.strip().lower()
    
    # Check for exact match
    if username.strip() in users:
        return True
    
    # Check for case-insensitive duplicate
    for existing_username in users.keys():
        if existing_username.lower() == username_normalized:
            return True
    
    return False


def validate_username(username: str) -> Tuple[bool, Optional[str]]:
    """Validate username format and availability"""
    if not username or not username.strip():
        return False, "Username cannot be empty"
    
    username = username.strip()
    
    # Check length
    if len(username) < 3:
        return False, "Username must be at least 3 characters"
    if len(username) > 30:
        return False, "Username must be 30 characters or less"
    
    # Check for valid characters (alphanumeric, underscore, hyphen)
    if not username.replace("_", "").replace("-", "").isalnum():
        return False, "Username can only contain letters, numbers, underscores, and hyphens"
    
    # Check if taken
    if is_username_taken(username):
        return False, "Username is already taken"
    
    return True, None


def validate_password(password: str) -> Tuple[bool, Optional[str]]:
    """Validate password strength"""
    if not password or not password.strip():
        return False, "Password cannot be empty"
    
    password = password.strip()
    
    # Check length
    if len(password) < 6:
        return False, "Password must be at least 6 characters"
    if len(password) > 128:
        return False, "Password must be 128 characters or less"
    
    return True, None


def create_user(username: str, password: str) -> Tuple[Optional[Dict], Optional[str]]:
    """
    Create a new user
    Returns: (user_dict, error_message)
    """
    # Validate username
    is_valid, error = validate_username(username)
    if not is_valid:
        return None, error
    
    # Validate password
    is_valid, error = validate_password(password)
    if not is_valid:
        return None, error
    
    # Normalize username (trim and lowercase for case-insensitive duplicate prevention)
    username_normalized = username.strip().lower()
    username_original = username.strip()
    
    users = load_users()
    
    # Check for duplicates (case-insensitive) - prevent "John" and "john" as separate users
    for existing_username in users.keys():
        if existing_username.lower() == username_normalized:
            return None, "Username is already taken"
    
    # Double-check username is not taken (race condition protection)
    if username_original in users:
        return None, "Username is already taken"
    
    # Create user with hashed password
    user = {
        "username": username_original,  # Preserve original case
        "password_hash": hash_password(password),  # Password is hashed, never stored in plain text
        "created_at": datetime.now().isoformat(),
        "assistant_id": None,  # Will be set during selection
        "profile": None,  # User profile from onboarding
        "onboarding_complete": False,  # Track if onboarding is done
        "conversations": []
    }
    
    users[username_original] = user
    save_users(users)
    
    # Log username creation for audit trail
    log_username(username, "created")
    
    return user, None


def authenticate_user(username: str, password: str) -> Optional[Dict]:
    """Authenticate a user"""
    users = load_users()
    
    if username not in users:
        return None
    
    user = users[username]
    if not verify_password(password, user["password_hash"]):
        return None
    
    # Return user without password hash
    user_copy = user.copy()
    user_copy.pop("password_hash", None)
    return user_copy


def get_user(username: str) -> Optional[Dict]:
    """Get user by username"""
    users = load_users()
    if username in users:
        user = users[username].copy()
        user.pop("password_hash", None)
        return user
    return None


def update_user_assistant(username: str, assistant_id: str):
    """Update user's selected assistant"""
    users = load_users()
    if username in users:
        users[username]["assistant_id"] = assistant_id
        save_users(users)
        return True
    return False


def update_user_profile(username: str, profile: Dict):
    """Update user's profile information"""
    users = load_users()
    if username in users:
        users[username]["profile"] = profile
        users[username]["onboarding_complete"] = True
        save_users(users)
        return True
    return False


def get_user_profile(username: str) -> Optional[Dict]:
    """Get user's profile"""
    users = load_users()
    if username in users:
        return users[username].get("profile")
    return None


# Top 10 onboarding questions
ONBOARDING_QUESTIONS = [
    {
        "id": "name",
        "question": "What's your name?",
        "type": "text",
        "placeholder": "Your name"
    },
    {
        "id": "occupation",
        "question": "What do you do for work?",
        "type": "text",
        "placeholder": "Your job title or profession"
    },
    {
        "id": "interests",
        "question": "What are your main interests or hobbies?",
        "type": "text",
        "placeholder": "e.g., photography, coding, music"
    },
    {
        "id": "goals",
        "question": "What are your main goals or what do you want to achieve?",
        "type": "text",
        "placeholder": "Your personal or professional goals"
    },
    {
        "id": "values",
        "question": "What do you care about most?",
        "type": "text",
        "placeholder": "e.g., family, creativity, efficiency"
    },
    {
        "id": "workflow",
        "question": "Describe your typical workday or workflow",
        "type": "textarea",
        "placeholder": "What does a typical day look like for you?"
    },
    {
        "id": "challenges",
        "question": "What tasks or challenges do you face regularly?",
        "type": "textarea",
        "placeholder": "Things that take up your time or cause frustration"
    },
    {
        "id": "tools",
        "question": "What tools or software do you use most?",
        "type": "text",
        "placeholder": "e.g., email, calendar, design software"
    },
    {
        "id": "communication",
        "question": "How do you prefer to communicate?",
        "type": "text",
        "placeholder": "e.g., email, messages, voice"
    },
    {
        "id": "automation",
        "question": "What tasks would you like to automate?",
        "type": "textarea",
        "placeholder": "Tasks you wish could be done automatically"
    }
]


# Available AI Skills for automation
AI_SKILLS = [
    {
        "id": "email_management",
        "name": "Email Management",
        "description": "Organize, filter, and respond to emails automatically",
        "icon": "📧",
        "category": "communication"
    },
    {
        "id": "calendar_scheduling",
        "name": "Calendar & Scheduling",
        "description": "Manage your calendar, schedule meetings, and set reminders",
        "icon": "📅",
        "category": "productivity"
    },
    {
        "id": "document_creation",
        "name": "Document Creation",
        "description": "Write, edit, and format documents, reports, and presentations",
        "icon": "📄",
        "category": "productivity"
    },
    {
        "id": "data_analysis",
        "name": "Data Analysis",
        "description": "Analyze data, create reports, and generate insights",
        "icon": "📊",
        "category": "analytics"
    },
    {
        "id": "content_generation",
        "name": "Content Generation",
        "description": "Create blog posts, social media content, and marketing materials",
        "icon": "✍️",
        "category": "content"
    },
    {
        "id": "code_assistance",
        "name": "Code Assistance",
        "description": "Write, debug, and optimize code in multiple languages",
        "icon": "💻",
        "category": "development"
    },
    {
        "id": "image_editing",
        "name": "Image Editing",
        "description": "Edit, enhance, and transform images automatically",
        "icon": "🖼️",
        "category": "media"
    },
    {
        "id": "video_processing",
        "name": "Video Processing",
        "description": "Edit, process, and enhance videos",
        "icon": "🎬",
        "category": "media"
    },
    {
        "id": "research",
        "name": "Research & Information",
        "description": "Research topics, summarize information, and answer questions",
        "icon": "🔍",
        "category": "knowledge"
    },
    {
        "id": "task_automation",
        "name": "Task Automation",
        "description": "Automate repetitive tasks and workflows",
        "icon": "⚙️",
        "category": "automation"
    },
    {
        "id": "translation",
        "name": "Translation",
        "description": "Translate text between multiple languages",
        "icon": "🌐",
        "category": "communication"
    },
    {
        "id": "meeting_notes",
        "name": "Meeting Notes & Summaries",
        "description": "Take notes, create summaries, and extract action items",
        "icon": "📝",
        "category": "productivity"
    },
    {
        "id": "todo_list",
        "name": "To Do List",
        "description": "Create, manage, and organize your to-do lists and tasks",
        "icon": "✅",
        "category": "productivity",
        "priority": 1  # Top priority
    },
    {
        "id": "bills",
        "name": "Bills",
        "description": "Track, organize, and manage your bills and payments",
        "icon": "💳",
        "category": "finance",
        "priority": 2  # Top priority
    },
    {
        "id": "budget",
        "name": "Budget",
        "description": "Create and manage budgets, track expenses, and financial planning",
        "icon": "💰",
        "category": "finance",
        "priority": 3  # Top priority
    },
    {
        "id": "crm",
        "name": "CRM",
        "description": "Customer Relationship Management - Manage contacts, deals, tasks, and business emails with full API access",
        "icon": "👥",
        "category": "business",
        "priority": 4
    },
    {
        "id": "expense_calculator",
        "name": "Expense Calculator",
        "description": "Track and calculate expenses, categorize spending, and analyze financial patterns",
        "icon": "💸",
        "category": "finance",
        "priority": 5
    },
    {
        "id": "meal_planning",
        "name": "Meal Planning",
        "description": "Plan meals for the week or month with AI assistance",
        "icon": "🍽️",
        "category": "lifestyle",
        "priority": 6
    }
]


def get_assistant(assistant_id: str) -> Optional[Dict]:
    """Get assistant by ID"""
    for assistant in BIBLICAL_ASSISTANTS:
        if assistant["id"] == assistant_id:
            return assistant
    return None


def get_all_assistants() -> List[Dict]:
    """Get all available assistants"""
    return BIBLICAL_ASSISTANTS

