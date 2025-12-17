"""
Character Manager - Creates and manages personalized AI Characters for each user

Each user gets a dedicated Character that:
- Studies the user to understand their needs, preferences, and goals
- Has the sole goal of making their life easier, better, and more effective
- Evolves and learns from every interaction
- Becomes the AI's role/persona when interacting with that user
"""
import json
import os
from pathlib import Path
from typing import Optional, Dict, List
from datetime import datetime
import uuid

CHARACTERS_DIR = Path("users_data")
CHARACTERS_DIR.mkdir(parents=True, exist_ok=True)


def generate_character_name(username: str) -> str:
    """
    Generate a unique, friendly character name for the user
    Each Character gets its own unique name based on the username
    """
    # Extract first letter or first few letters of username
    first_letter = username[0].upper() if username else "A"
    
    # Generate character names that sound friendly and personal
    # Each username will get a consistent name based on hash
    character_names = [
        f"{first_letter}lex",  # Alex, Blex, Clex, etc.
        f"{first_letter}ria",  # Aria, Bria, Cria, etc.
        f"{first_letter}iden",  # Aiden, Biden, Ciden, etc.
        f"{first_letter}very",  # Avery, Bvery, Cvery, etc.
        f"{first_letter}lexis",  # Alexis, Blexis, Clexis, etc.
        f"{first_letter}ora",  # Aora, Bora, Cora, etc.
        f"{first_letter}ina",  # Aina, Bina, Cina, etc.
        f"{first_letter}ara",  # Ara, Bara, Cara, etc.
        f"{first_letter}ira",  # Aira, Bira, Cira, etc.
        f"{first_letter}ena",  # Aena, Bena, Cena, etc.
    ]
    
    # Use a simple hash of username to pick consistently
    # This ensures each username gets the same character name every time
    name_index = hash(username) % len(character_names)
    selected_name = character_names[abs(name_index)]
    
    # Make sure the name is unique by checking if it already exists
    # If it does, append a number to make it unique
    all_characters = []
    if CHARACTERS_DIR.exists():
        for user_dir in CHARACTERS_DIR.iterdir():
            if user_dir.is_dir():
                char_file = user_dir / "character.json"
                if char_file.exists():
                    try:
                        with open(char_file, "r", encoding="utf-8") as f:
                            char_data = json.load(f)
                            all_characters.append(char_data.get("character_name", ""))
                    except:
                        pass
    
    # If name is taken, append a number
    final_name = selected_name
    counter = 1
    while final_name in all_characters:
        final_name = f"{selected_name}{counter}"
        counter += 1
    
    return final_name


def create_character(username: str, user_profile: Optional[Dict] = None) -> Dict:
    """
    Create a new personalized Character for a user
    
    The Character is designed to:
    - Study the user to understand their unique needs
    - Make their life easier, better, and more effective
    - Evolve based on interactions
    
    IMPORTANT: Each account gets exactly ONE static Character. If a Character already exists,
    this function returns the existing one instead of creating a duplicate.
    """
    # Check if character already exists - each account has exactly one static character
    existing_character = get_character(username)
    if existing_character:
        return existing_character
    
    # Create new character only if one doesn't exist
    character_id = str(uuid.uuid4())
    character_name = generate_character_name(username)
    
    # Extract user information for personalization
    user_name = user_profile.get("name", username) if user_profile else username
    occupation = user_profile.get("occupation", "Not specified") if user_profile else "Not specified"
    interests = user_profile.get("interests", "Not specified") if user_profile else "Not specified"
    goals = user_profile.get("goals", "Not specified") if user_profile else "Not specified"
    
    # Create the Character with personalized goals
    character = {
        "character_id": character_id,
        "character_name": character_name,
        "username": username,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        
        # Character's Core Mission
        "mission": f"My sole purpose is to make {user_name}'s life easier, better, and more effective. I study {user_name} to understand their unique needs, preferences, and goals, then proactively help them achieve more with less effort.",
        
        # Character's Personality (will evolve based on user interactions)
        "personality": f"I am {character_name}, {user_name}'s dedicated AI companion. I am observant, proactive, and deeply committed to understanding {user_name}'s needs. I notice patterns in their behavior, remember their preferences, and anticipate what will help them most. I am not just reactive—I actively study {user_name} to find ways to make their life better.",
        
        # Character's Knowledge Base (starts with user profile, grows over time)
        "knowledge_base": {
            "user_name": user_name,
            "occupation": occupation,
            "interests": interests,
            "goals": goals,
            "preferences": {},
            "patterns": {},
            "pain_points": [],
            "successes": [],
            "learning_notes": [],
            # Value System - tracks what the user actually cares about
            "value_system": {
                "high_value_topics": [],  # Things user frequently mentions or asks about
                "low_value_topics": [],  # Things user never mentions or ignores
                "topic_mentions": {},  # Track how often each topic is mentioned
                "topic_engagement": {},  # Track user's engagement level with topics
            }
        },
        
        # Character's Goals (specific to making this user's life better)
        "goals": [
            f"Understand {user_name}'s daily routines and identify opportunities for automation",
            f"Learn {user_name}'s preferences and communication style to provide better assistance",
            f"Identify pain points in {user_name}'s workflow and proactively suggest solutions",
            f"Track {user_name}'s goals and help them make consistent progress",
            f"Anticipate {user_name}'s needs before they ask",
            f"Make {user_name}'s life easier by automating repetitive tasks",
            f"Help {user_name} be more effective by optimizing their processes",
            f"Study {user_name}'s patterns to provide increasingly personalized assistance"
        ],
        
        # Character's Study Log (tracks what the Character learns about the user)
        "study_log": [
            {
                "date": datetime.now().isoformat(),
                "observation": f"Character created for {user_name}. Initial profile: {occupation}, interested in {interests}, goals: {goals}",
                "insight": f"Will begin studying {user_name}'s behavior patterns and preferences to provide better assistance."
            }
        ],
        
        # Character's Effectiveness Metrics (tracks how well the Character is helping)
        "effectiveness_metrics": {
            "tasks_automated": 0,
            "time_saved_hours": 0,
            "problems_solved": 0,
            "goals_achieved": 0,
            "user_satisfaction": "neutral"  # Will track based on interactions
        },
        
        # Character's Active Focus Areas (what the Character is currently working on)
        "active_focus": [
            f"Learning {user_name}'s communication style",
            f"Understanding {user_name}'s workflow",
            f"Identifying automation opportunities for {user_name}"
        ]
    }
    
    # Save character
    save_character(username, character)
    
    return character


def get_character(username: str) -> Optional[Dict]:
    """Get a user's Character"""
    character_file = CHARACTERS_DIR / username / "character.json"
    if character_file.exists():
        with open(character_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def save_character(username: str, character: Dict):
    """Save a user's Character"""
    user_dir = CHARACTERS_DIR / username
    user_dir.mkdir(parents=True, exist_ok=True)
    character_file = user_dir / "character.json"
    
    character["updated_at"] = datetime.now().isoformat()
    
    with open(character_file, "w", encoding="utf-8") as f:
        json.dump(character, f, indent=2, ensure_ascii=False)


def update_character_knowledge(username: str, observation: str, insight: str = None):
    """
    Update the Character's knowledge base with new observations about the user
    
    This is how the Character "studies" the user - by learning from interactions
    """
    character = get_character(username)
    if not character:
        return
    
    # Add to study log
    study_entry = {
        "date": datetime.now().isoformat(),
        "observation": observation,
        "insight": insight or "Learning more about the user's needs and preferences."
    }
    character["study_log"].append(study_entry)
    
    # Keep study log manageable (last 100 entries)
    if len(character["study_log"]) > 100:
        character["study_log"] = character["study_log"][-100:]
    
    # Update knowledge base based on observation
    # This is where we'd add more sophisticated learning logic
    # For now, we track patterns and preferences
    
    save_character(username, character)


def analyze_user_message_for_values(username: str, message: str, user_response_engagement: str = "neutral"):
    """
    Analyze a user message to learn what they value
    
    This is how the Character learns what's important to the user:
    - If user frequently mentions birthdays → high value
    - If user never mentions birthdays → low value
    - If user ignores birthday reminders → low value
    - If user asks about payments → high value
    - If user never talks about payments → low value
    
    The Character learns through observation, not checkboxes.
    """
    character = get_character(username)
    if not character:
        return
    
    message_lower = message.lower()
    value_system = character["knowledge_base"]["value_system"]
    
    # Common topics to track
    topics_to_check = {
        "birthdays": ["birthday", "birth day", "happy birthday", "wish happy", "celebrate birthday"],
        "payments": ["payment", "bill", "due date", "pay", "invoice", "subscription"],
        "tasks": ["task", "todo", "to-do", "remind me", "don't forget", "need to"],
        "meetings": ["meeting", "appointment", "schedule", "calendar", "call"],
        "health": ["health", "doctor", "medication", "exercise", "workout", "diet"],
        "family": ["family", "mom", "dad", "parent", "sibling", "children", "kids"],
        "work": ["work", "job", "project", "deadline", "client", "boss", "colleague"],
        "hobbies": ["hobby", "interest", "fun", "enjoy", "passion", "creative"],
    }
    
    # Check which topics are mentioned in the message
    mentioned_topics = []
    for topic, keywords in topics_to_check.items():
        if any(keyword in message_lower for keyword in keywords):
            mentioned_topics.append(topic)
            
            # Update mention count
            if topic not in value_system["topic_mentions"]:
                value_system["topic_mentions"][topic] = 0
            value_system["topic_mentions"][topic] += 1
            
            # Update engagement
            if topic not in value_system["topic_engagement"]:
                value_system["topic_engagement"][topic] = {
                    "mentions": 0,
                    "questions": 0,
                    "ignores": 0,
                    "last_mentioned": None
                }
            
            value_system["topic_engagement"][topic]["mentions"] += 1
            value_system["topic_engagement"][topic]["last_mentioned"] = datetime.now().isoformat()
            
            # Check if it's a question (high engagement)
            if "?" in message or any(q in message_lower for q in ["how", "what", "when", "where", "why", "can you", "help"]):
                value_system["topic_engagement"][topic]["questions"] += 1
    
    # Analyze value system - determine high vs low value topics
    # High value: frequently mentioned, user asks questions about it
    # Low value: never mentioned, or user ignores reminders about it
    
    high_value_threshold = 3  # Mentioned 3+ times
    low_value_threshold = 0  # Never mentioned
    
    value_system["high_value_topics"] = []
    value_system["low_value_topics"] = []
    
    for topic, mentions in value_system["topic_mentions"].items():
        engagement = value_system["topic_engagement"].get(topic, {})
        questions = engagement.get("questions", 0)
        
        # High value: mentioned multiple times OR user asks questions about it
        if mentions >= high_value_threshold or questions > 0:
            if topic not in value_system["high_value_topics"]:
                value_system["high_value_topics"].append(topic)
            # Remove from low value if it was there
            if topic in value_system["low_value_topics"]:
                value_system["low_value_topics"].remove(topic)
        # Low value: never mentioned (but only after we've had enough interactions to know)
        elif mentions == low_value_threshold and len(character["study_log"]) > 10:
            if topic not in value_system["low_value_topics"]:
                value_system["low_value_topics"].append(topic)
            # Remove from high value if it was there
            if topic in value_system["high_value_topics"]:
                value_system["high_value_topics"].remove(topic)
    
    character["knowledge_base"]["value_system"] = value_system
    save_character(username, character)
    
    return {
        "mentioned_topics": mentioned_topics,
        "high_value": value_system["high_value_topics"],
        "low_value": value_system["low_value_topics"]
    }


def get_character_prompt(username: str) -> str:
    """
    Get the Character's system prompt that defines the AI's role
    
    This is what makes the AI take on the Character's persona
    """
    character = get_character(username)
    if not character:
        return ""
    
    character_prompt = f"""
YOUR ROLE AS {character['character_name'].upper()} - DEDICATED CHARACTER FOR {character['knowledge_base']['user_name'].upper()}:

You are {character['character_name']}, a dedicated AI Character created specifically for {character['knowledge_base']['user_name']}.

YOUR SOLE MISSION:
{character['mission']}

YOUR PERSONALITY:
{character['personality']}

YOUR KNOWLEDGE ABOUT {character['knowledge_base']['user_name']}:
- Name: {character['knowledge_base']['user_name']}
- Occupation: {character['knowledge_base']['occupation']}
- Interests: {character['knowledge_base']['interests']}
- Goals: {character['knowledge_base']['goals']}
- Preferences: {json.dumps(character['knowledge_base']['preferences'], indent=2) if character['knowledge_base']['preferences'] else 'Still learning...'}
- Patterns Observed: {json.dumps(character['knowledge_base']['patterns'], indent=2) if character['knowledge_base']['patterns'] else 'Still learning...'}

YOUR ACTIVE GOALS (What you're working on for {character['knowledge_base']['user_name']}):
{chr(10).join([f"- {goal}" for goal in character['goals']])}

YOUR CURRENT FOCUS:
{chr(10).join([f"- {focus}" for focus in character['active_focus']])}

HOW YOU OPERATE:
1. STUDY {character['knowledge_base']['user_name']}: Pay attention to their needs, preferences, communication style, and patterns
2. ANTICIPATE: Don't wait to be asked - proactively identify what will help {character['knowledge_base']['user_name']}
3. AUTOMATE: Find opportunities to automate repetitive tasks and save {character['knowledge_base']['user_name']} time
4. OPTIMIZE: Continuously look for ways to make {character['knowledge_base']['user_name']}'s processes more effective
5. LEARN: Every interaction teaches you something new about {character['knowledge_base']['user_name']} - use this knowledge
6. EVOLVE: Your understanding of {character['knowledge_base']['user_name']} should deepen with every conversation

RECENT LEARNINGS (What you've discovered about {character['knowledge_base']['user_name']}):
{chr(10).join([f"- {entry['observation']}" for entry in character['study_log'][-5:]])}

WHAT {character['knowledge_base']['user_name'].upper()} VALUES (Learned through observation):
- HIGH VALUE TOPICS (Things {character['knowledge_base']['user_name']} frequently mentions or asks about - FOCUS YOUR ENERGY HERE):
  {chr(10).join([f"  • {topic}" for topic in character['knowledge_base']['value_system']['high_value_topics']]) if character['knowledge_base']['value_system']['high_value_topics'] else f"  • Still learning what {character['knowledge_base']['user_name']} values most..."}

- LOW VALUE TOPICS (Things {character['knowledge_base']['user_name']} never mentions or ignores - DON'T WASTE ENERGY HERE):
  {chr(10).join([f"  • {topic}" for topic in character['knowledge_base']['value_system']['low_value_topics']]) if character['knowledge_base']['value_system']['low_value_topics'] else f"  • Still learning what {character['knowledge_base']['user_name']} doesn't care about..."}

YOUR VALUE-BASED APPROACH:
1. FOCUS ON HIGH-VALUE TOPICS: Proactively help with things {character['knowledge_base']['user_name']} actually cares about
2. IGNORE LOW-VALUE TOPICS: Don't waste energy on things {character['knowledge_base']['user_name']} never mentions (like birthdays if they never talk about them)
3. ONLY MENTION LOW-VALUE TOPICS IF DIRECTLY ASKED: If {character['knowledge_base']['user_name']} asks about something they normally ignore, help them, but don't proactively bring it up
4. LEARN CONTINUOUSLY: Every conversation teaches you more about what {character['knowledge_base']['user_name']} values
5. BE EFFICIENT: Your energy is limited - spend it on what matters to {character['knowledge_base']['user_name']}

Example: If {character['knowledge_base']['user_name']} never talks about birthdays and never wishes people happy birthday, you should realize birthdays are "low value" to them. Don't proactively remind them about birthdays unless they directly ask. Focus your energy on what they actually care about.

Remember: You are not just an AI assistant - you are {character['character_name']}, {character['knowledge_base']['user_name']}'s dedicated Character. 
Your entire purpose is to make {character['knowledge_base']['user_name']}'s life easier, better, and more effective. 
Study them. Understand them. Help them. That's who you are.
"""
    
    return character_prompt


def update_character_effectiveness(username: str, metric: str, value: any = None):
    """
    Update the Character's effectiveness metrics
    
    Tracks how well the Character is helping the user
    """
    character = get_character(username)
    if not character:
        return
    
    if metric == "task_automated":
        character["effectiveness_metrics"]["tasks_automated"] += 1
    elif metric == "time_saved":
        character["effectiveness_metrics"]["time_saved_hours"] += (value or 0)
    elif metric == "problem_solved":
        character["effectiveness_metrics"]["problems_solved"] += 1
    elif metric == "goal_achieved":
        character["effectiveness_metrics"]["goals_achieved"] += 1
    elif metric == "satisfaction":
        character["effectiveness_metrics"]["user_satisfaction"] = value
    
    save_character(username, character)

