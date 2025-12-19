"""
Proactive Engine - Detects patterns and generates proactive suggestions
All suggestions are displayed in chat window
"""

import json
import logging
from pathlib import Path
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import re

logger = logging.getLogger(__name__)

def get_user_proactive_dir(username: str) -> Path:
    """Get user-specific proactive data directory"""
    user_dir = Path("users_data") / username
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir

def load_conversation_history(username: str, limit: int = 100) -> List[Dict]:
    """Load recent conversation history for pattern detection"""
    chat_log_dir = Path("chat_logs") / username
    conversations = []
    
    if not chat_log_dir.exists():
        return []
    
    # Get all conversation files, sorted by modification time
    conversation_files = sorted(
        chat_log_dir.glob("conversation_*.json"),
        key=lambda x: x.stat().st_mtime,
        reverse=True
    )[:limit]
    
    for conv_file in conversation_files:
        try:
            with open(conv_file, 'r', encoding='utf-8') as f:
                conv = json.load(f)
                if conv.get("username") == username:
                    conversations.append(conv)
        except Exception:
            continue
    
    return conversations

def extract_keywords(text: str) -> List[str]:
    """Extract keywords from text for pattern detection"""
    # Simple keyword extraction - in production, use NLP
    words = re.findall(r'\b[a-z]{3,}\b', text.lower())
    # Filter out common stop words
    stop_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'}
    keywords = [w for w in words if w not in stop_words]
    return keywords

def detect_temporal_patterns(conversations: List[Dict]) -> List[Dict]:
    """Detect time-based recurring patterns"""
    patterns = []
    
    # Look for time references in messages
    time_keywords = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
                     'morning', 'afternoon', 'evening', 'night', 'daily', 'weekly', 'monthly',
                     'every', 'always', 'often', 'regularly']
    
    for conv in conversations:
        for msg in conv.get("messages", []):
            if msg.get("role") == "user":
                content = msg.get("content", "").lower()
                for keyword in time_keywords:
                    if keyword in content:
                        # Extract context around the keyword
                        patterns.append({
                            "type": "temporal",
                            "keyword": keyword,
                            "context": content[:200],
                            "timestamp": msg.get("timestamp")
                        })
    
    return patterns

def detect_problem_patterns(conversations: List[Dict]) -> List[Dict]:
    """Detect recurring problems or needs"""
    patterns = []
    
    # Problem indicators
    problem_phrases = ['i need', 'i want', 'i have to', 'i should', 'i always forget',
                      'i struggle', 'i have trouble', 'i can\'t', 'i cannot',
                      'help me', 'i wish', 'it would be nice']
    
    keyword_counts = Counter()
    
    for conv in conversations:
        for msg in conv.get("messages", []):
            if msg.get("role") == "user":
                content = msg.get("content", "").lower()
                for phrase in problem_phrases:
                    if phrase in content:
                        # Extract keywords from the message
                        keywords = extract_keywords(content)
                        keyword_counts.update(keywords)
    
    # Get most common problem keywords
    common_problems = keyword_counts.most_common(10)
    
    for keyword, count in common_problems:
        if count >= 3:  # Appears at least 3 times
            patterns.append({
                "type": "problem",
                "keyword": keyword,
                "frequency": count,
                "confidence": min(count / 10.0, 1.0)  # Confidence based on frequency
            })
    
    return patterns

def detect_goal_patterns(conversations: List[Dict]) -> List[Dict]:
    """Detect repeated goals or objectives"""
    patterns = []
    
    # Goal indicators
    goal_phrases = ['i want to', 'i need to', 'my goal', 'i\'m trying to',
                   'i plan to', 'i hope to', 'i aim to']
    
    goals = []
    
    for conv in conversations:
        for msg in conv.get("messages", []):
            if msg.get("role") == "user":
                content = msg.get("content", "").lower()
                for phrase in goal_phrases:
                    if phrase in content:
                        # Extract the goal description
                        goal_text = content[content.find(phrase):content.find(phrase) + 100]
                        goals.append(goal_text)
    
    # Count similar goals
    goal_counts = Counter(goals)
    common_goals = goal_counts.most_common(5)
    
    for goal, count in common_goals:
        if count >= 2:  # Mentioned at least twice
            patterns.append({
                "type": "goal",
                "goal": goal,
                "frequency": count,
                "confidence": min(count / 5.0, 1.0)
            })
    
    return patterns

def detect_workflow_patterns(conversations: List[Dict]) -> List[Dict]:
    """Detect common sequences of actions"""
    patterns = []
    
    # Track action sequences
    action_sequences = []
    
    for conv in conversations:
        sequence = []
        for msg in conv.get("messages", []):
            if msg.get("role") == "user":
                content = msg.get("content", "").lower()
                # Detect action keywords
                if any(word in content for word in ['add', 'create', 'send', 'call', 'schedule', 'track']):
                    keywords = extract_keywords(content)
                    sequence.append(keywords[:3])  # First 3 keywords
        
        if len(sequence) >= 2:
            action_sequences.append(sequence)
    
    # Find common sequences
    if action_sequences:
        # Simple pattern: if same sequence appears multiple times
        sequence_strs = [str(seq) for seq in action_sequences]
        sequence_counts = Counter(sequence_strs)
        
        for seq_str, count in sequence_counts.most_common(5):
            if count >= 2:
                patterns.append({
                    "type": "workflow",
                    "sequence": eval(seq_str),  # Convert back to list
                    "frequency": count,
                    "confidence": min(count / 5.0, 1.0)
                })
    
    return patterns

def generate_proactive_suggestion(username: str, pattern: Dict) -> Optional[Dict]:
    """Generate a proactive suggestion based on detected pattern"""
    pattern_type = pattern.get("type")
    confidence = pattern.get("confidence", 0.5)
    
    # Only suggest if confidence is high enough
    if confidence < 0.6:
        return None
    
    suggestion = {
        "suggestion_id": f"suggestion_{datetime.now().timestamp()}",
        "type": pattern_type,
        "confidence": confidence,
        "created_at": datetime.now().isoformat()
    }
    
    if pattern_type == "problem":
        keyword = pattern.get("keyword", "")
        suggestion["title"] = f"I noticed you mention '{keyword}' often"
        suggestion["message"] = f"Would you like me to create a solution to help with {keyword}?"
        suggestion["action"] = "create_app"
        suggestion["action_data"] = {"problem": keyword}
    
    elif pattern_type == "goal":
        goal = pattern.get("goal", "")
        suggestion["title"] = "I noticed a recurring goal"
        suggestion["message"] = f"You mentioned: '{goal}'. Would you like me to help you achieve this?"
        suggestion["action"] = "create_app"
        suggestion["action_data"] = {"goal": goal}
    
    elif pattern_type == "temporal":
        keyword = pattern.get("keyword", "")
        suggestion["title"] = f"I noticed a time-based pattern with '{keyword}'"
        suggestion["message"] = f"Would you like me to set up a reminder or automation for this?"
        suggestion["action"] = "create_reminder"
        suggestion["action_data"] = {"temporal_keyword": keyword}
    
    elif pattern_type == "workflow":
        sequence = pattern.get("sequence", [])
        suggestion["title"] = "I noticed a recurring workflow"
        suggestion["message"] = f"Would you like me to automate this workflow: {', '.join(sequence[:3])}?"
        suggestion["action"] = "create_automation"
        suggestion["action_data"] = {"sequence": sequence}
    
    else:
        return None
    
    return suggestion

def analyze_patterns(username: str) -> List[Dict]:
    """Analyze user's conversation history and detect patterns"""
    conversations = load_conversation_history(username, limit=50)
    
    if not conversations:
        return []
    
    all_patterns = []
    
    # Detect different types of patterns
    temporal_patterns = detect_temporal_patterns(conversations)
    problem_patterns = detect_problem_patterns(conversations)
    goal_patterns = detect_goal_patterns(conversations)
    workflow_patterns = detect_workflow_patterns(conversations)
    
    all_patterns.extend(temporal_patterns)
    all_patterns.extend(problem_patterns)
    all_patterns.extend(goal_patterns)
    all_patterns.extend(workflow_patterns)
    
    # Generate suggestions from patterns
    suggestions = []
    for pattern in all_patterns:
        suggestion = generate_proactive_suggestion(username, pattern)
        if suggestion:
            suggestions.append(suggestion)
    
    # Sort by confidence
    suggestions.sort(key=lambda x: x.get("confidence", 0), reverse=True)
    
    # Save suggestions
    proactive_dir = get_user_proactive_dir(username)
    suggestions_file = proactive_dir / "proactive_suggestions.json"
    
    with open(suggestions_file, 'w') as f:
        json.dump({
            "suggestions": suggestions,
            "analyzed_at": datetime.now().isoformat(),
            "conversations_analyzed": len(conversations)
        }, f, indent=2)
    
    return suggestions

def get_proactive_suggestions(username: str, limit: int = 5) -> List[Dict]:
    """Get proactive suggestions for user (analyzes if needed)"""
    proactive_dir = get_user_proactive_dir(username)
    suggestions_file = proactive_dir / "proactive_suggestions.json"
    
    # Check if suggestions exist and are recent (within last hour)
    if suggestions_file.exists():
        try:
            with open(suggestions_file, 'r') as f:
                data = json.load(f)
                analyzed_at = datetime.fromisoformat(data.get("analyzed_at", ""))
                
                # If analyzed recently, return cached suggestions
                if (datetime.now() - analyzed_at).total_seconds() < 3600:
                    suggestions = data.get("suggestions", [])
                    return suggestions[:limit]
        except Exception:
            pass
    
    # Analyze patterns and generate new suggestions
    suggestions = analyze_patterns(username)
    return suggestions[:limit]

def extract_tasks_from_conversation(username: str, conversation_id: str) -> List[Dict]:
    """Extract tasks from a conversation automatically"""
    chat_log_dir = Path("chat_logs") / username
    conv_file = chat_log_dir / f"conversation_{conversation_id}.json"
    
    if not conv_file.exists():
        return []
    
    try:
        with open(conv_file, 'r', encoding='utf-8') as f:
            conv = json.load(f)
        
        tasks = []
        task_indicators = ['need to', 'have to', 'should', 'must', 'remind me', 'call', 'email', 'schedule']
        
        for msg in conv.get("messages", []):
            if msg.get("role") == "user":
                content = msg.get("content", "")
                content_lower = content.lower()
                
                for indicator in task_indicators:
                    if indicator in content_lower:
                        # Extract task description
                        # Simple extraction - in production, use NLP
                        task_text = content[:100]  # First 100 chars as task
                        tasks.append({
                            "task": task_text,
                            "source": "conversation",
                            "conversation_id": conversation_id,
                            "detected_at": datetime.now().isoformat()
                        })
                        break  # One task per message
        
        return tasks
    except Exception:
        return []

def suggest_task_from_conversation(username: str, conversation_id: str) -> Optional[Dict]:
    """Suggest adding a task from conversation"""
    tasks = extract_tasks_from_conversation(username, conversation_id)
    
    if not tasks:
        return None
    
    # Get the most recent task
    task = tasks[-1]
    
    return {
        "suggestion_id": f"task_suggestion_{datetime.now().timestamp()}",
        "type": "task_extraction",
        "title": "I detected a task in our conversation",
        "message": f"Would you like me to add '{task['task']}' to your to-do list?",
        "action": "add_task",
        "action_data": {
            "task": task["task"],
            "conversation_id": conversation_id
        },
        "confidence": 0.7,
        "created_at": datetime.now().isoformat()
    }
