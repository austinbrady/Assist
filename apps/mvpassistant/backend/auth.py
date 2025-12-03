"""
User Authentication and Profile Management
"""
import json
import hashlib
import secrets
import os
import shutil
from pathlib import Path
from typing import Optional, Dict, List, Tuple
from datetime import datetime
from passlib.context import CryptContext
import bcrypt
import wallet_generator

# Use bcrypt directly to avoid passlib initialization issues
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

USERS_DIR = Path("users")
USERS_DIR.mkdir(exist_ok=True)
USERS_FILE = USERS_DIR / "users.json"
USERNAME_LOG_FILE = USERS_DIR / "username_log.json"

def load_users() -> Dict:
    """Load users from JSON file"""
    if USERS_FILE.exists():
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_users(users: Dict):
    """Save users to JSON file with robust error handling and atomic write"""
    import tempfile
    import shutil
    
    try:
        # Create a temporary file first (atomic write)
        temp_file = USERS_FILE.with_suffix('.tmp')
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2, ensure_ascii=False)
            f.flush()
            os.fsync(f.fileno())  # Force write to disk
        
        # Atomically replace the old file
        shutil.move(str(temp_file), str(USERS_FILE))
    except Exception as e:
        # If temp file exists, remove it
        if temp_file.exists():
            temp_file.unlink()
        raise Exception(f"Failed to save users: {str(e)}")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt directly"""
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        import hashlib
        password_hash = hashlib.sha256(password_bytes).digest()
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
        
        if len(password_bytes) > 72:
            import hashlib
            password_hash = hashlib.sha256(password_bytes).digest()
            return bcrypt.checkpw(password_hash, hashed_bytes)
        else:
            return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def is_username_taken(username: str) -> bool:
    """Check if username is already taken (case-insensitive)"""
    users = load_users()
    username_normalized = username.strip().lower()
    
    if username.strip() in users:
        return True
    
    for existing_username in users.keys():
        if existing_username.lower() == username_normalized:
            return True
    
    return False


def validate_username(username: str) -> Tuple[bool, Optional[str]]:
    """Validate username format and availability"""
    if not username or not username.strip():
        return False, "Username cannot be empty"
    
    username = username.strip()
    
    if len(username) < 3:
        return False, "Username must be at least 3 characters"
    if len(username) > 30:
        return False, "Username must be 30 characters or less"
    
    if not username.replace("_", "").replace("-", "").isalnum():
        return False, "Username can only contain letters, numbers, underscores, and hyphens"
    
    if is_username_taken(username):
        return False, "Username is already taken"
    
    return True, None


def validate_password(password: str) -> Tuple[bool, Optional[str]]:
    """Validate password strength"""
    if not password or not password.strip():
        return False, "Password cannot be empty"
    
    password = password.strip()
    
    if len(password) < 6:
        return False, "Password must be at least 6 characters"
    if len(password) > 128:
        return False, "Password must be 128 characters or less"
    
    return True, None


def generate_mvp_character_name(gender: str) -> str:
    """Generate an MVP character name based on gender"""
    import random
    
    male_names = [
        "Alex", "Jordan", "Casey", "Morgan", "Riley", "Quinn", "Avery", "Sage",
        "Cameron", "Dakota", "Blake", "River", "Phoenix", "Skylar", "Taylor",
        "Sam", "Jamie", "Reese", "Drew", "Finley", "Hayden", "Parker", "Rowan",
        "Max", "Noah", "Ethan", "Lucas", "Mason", "Logan", "Owen", "Carter"
    ]
    
    female_names = [
        "Alex", "Jordan", "Casey", "Morgan", "Riley", "Quinn", "Avery", "Sage",
        "Cameron", "Dakota", "Blake", "River", "Phoenix", "Skylar", "Taylor",
        "Sam", "Jamie", "Reese", "Drew", "Finley", "Hayden", "Parker", "Rowan",
        "Emma", "Olivia", "Sophia", "Isabella", "Mia", "Charlotte", "Amelia", "Harper"
    ]
    
    if gender.lower() == "male":
        return random.choice(male_names)
    elif gender.lower() == "female":
        return random.choice(female_names)
    else:
        # Default to a neutral name if gender is not specified
        return random.choice(male_names + female_names)


def create_user(first_name: str, last_name: str, gender: str, password: str) -> Tuple[Optional[Dict], Optional[str]]:
    """Create a new user with first name, last name, and gender"""
    # Validate inputs
    if not first_name or not first_name.strip():
        return None, "First name cannot be empty"
    if not last_name or not last_name.strip():
        return None, "Last name cannot be empty"
    if not gender or gender.lower() not in ["male", "female"]:
        return None, "Gender must be 'male' or 'female'"
    
    is_valid, error = validate_password(password)
    if not is_valid:
        return None, error
    
    # Generate username from first_name and last_name (no underscore)
    first_name_clean = first_name.strip().lower().replace(" ", "")
    last_name_clean = last_name.strip().lower().replace(" ", "")
    base_username = f"{first_name_clean}{last_name_clean}"
    
    users = load_users()
    
    # Check if username exists, if so append a number
    username = base_username
    counter = 1
    while username in users or any(existing.lower() == username.lower() for existing in users.keys()):
        username = f"{base_username}{counter}"
        counter += 1
    
    # Generate MVP character name based on gender
    mvp_character_name = generate_mvp_character_name(gender)
    
    # Generate cryptocurrency wallets
    wallets = wallet_generator.generate_all_wallets()
    
    user = {
        "username": username,
        "first_name": first_name.strip(),
        "last_name": last_name.strip(),
        "gender": gender.lower(),
        "password_hash": hash_password(password),
        "created_at": datetime.now().isoformat(),
        "profile": {
            "first_name": first_name.strip(),
            "last_name": last_name.strip(),
            "gender": gender.lower(),
            "mvp_character_name": mvp_character_name,
            "wallets": wallets  # Store wallets in profile
        },
        "onboarding_complete": True,  # Skip onboarding
        "generated_skills": [],  # Solutions created through chat
        "dashboard_config": {}  # Simple dashboard
    }
    
    users[username] = user
    
    # Save users with error handling
    try:
        save_users(users)
    except Exception as e:
        return None, f"Failed to save user account: {str(e)}"
    
    return user, None


def authenticate_user(username: str, password: str) -> Optional[Dict]:
    """Authenticate a user"""
    users = load_users()
    
    if username not in users:
        return None
    
    user = users[username]
    if not verify_password(password, user["password_hash"]):
        return None
    
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


def update_user_skills(username: str, skills: List[Dict]):
    """Update user's generated skills"""
    users = load_users()
    if username in users:
        users[username]["generated_skills"] = skills
        save_users(users)
        return True
    return False


def get_user_skills(username: str) -> List[Dict]:
    """Get user's generated skills"""
    users = load_users()
    if username in users:
        return users[username].get("generated_skills", [])
    return []


def update_dashboard_config(username: str, config: Dict):
    """Update user's dashboard configuration"""
    users = load_users()
    if username in users:
        users[username]["dashboard_config"] = config
        save_users(users)
        return True
    return False


def get_dashboard_config(username: str) -> Optional[Dict]:
    """Get user's dashboard configuration"""
    users = load_users()
    if username in users:
        return users[username].get("dashboard_config")
    return None


# Personalized onboarding questions that adapt based on user responses
# These questions help understand the user's specific needs to generate custom tools
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
        "placeholder": "Your job title or profession (e.g., marketer, developer, designer)"
    },
    {
        "id": "work_description",
        "question": "Can you describe your typical workday? What tasks do you do regularly?",
        "type": "textarea",
        "placeholder": "Describe your daily workflow and responsibilities"
    },
    {
        "id": "challenges",
        "question": "What are the biggest challenges or pain points in your work?",
        "type": "textarea",
        "placeholder": "What tasks take too much time or cause frustration?"
    },
    {
        "id": "tools_used",
        "question": "What tools or software do you currently use?",
        "type": "text",
        "placeholder": "e.g., email, calendar, CRM, design tools, spreadsheets"
    },
    {
        "id": "automation_needs",
        "question": "What tasks would you like to automate or make easier?",
        "type": "textarea",
        "placeholder": "Be specific about what you'd like automated"
    },
    {
        "id": "goals",
        "question": "What are your main professional or personal goals?",
        "type": "textarea",
        "placeholder": "What do you want to achieve?"
    },
    {
        "id": "data_management",
        "question": "How do you currently manage information, contacts, or data?",
        "type": "textarea",
        "placeholder": "Describe your current system (or lack thereof)"
    },
    {
        "id": "communication_style",
        "question": "How do you prefer to communicate and stay organized?",
        "type": "text",
        "placeholder": "e.g., email, messages, voice, visual dashboards"
    },
    {
        "id": "specific_needs",
        "question": "Is there a specific tool or system you wish existed for your work?",
        "type": "textarea",
        "placeholder": "Describe what you need (e.g., 'a CRM for tracking my marketing clients')"
    }
]

