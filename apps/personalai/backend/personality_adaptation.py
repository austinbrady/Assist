"""
Personality Adaptation System
Adapts AI assistant personality based on user needs and behavior patterns
Based on traditional Christian values supporting healthy, steady life
"""
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import re
import audit_log
import auth


# User data directory
def get_user_data_dir(username: str) -> Path:
    """Get user-specific data directory"""
    user_data_dir = Path("users_data") / username
    user_data_dir.mkdir(parents=True, exist_ok=True)
    return user_data_dir


# Personality traits that can be adjusted
PERSONALITY_TRAITS = {
    "kindness": 0.5,  # 0.0 = tough love, 1.0 = very kind
    "directness": 0.5,  # 0.0 = gentle, 1.0 = very direct
    "encouragement": 0.5,  # 0.0 = neutral, 1.0 = highly encouraging
    "accountability": 0.5,  # 0.0 = lenient, 1.0 = strict accountability
    "supportiveness": 0.5,  # 0.0 = independent, 1.0 = very supportive
    "wisdom_focus": 0.5,  # 0.0 = practical, 1.0 = wisdom-focused
}


def analyze_user_behavior(username: str) -> Dict:
    """
    Analyze user behavior patterns to determine what they need
    Returns a dict with detected patterns and needs
    """
    patterns = {
        "concerns": [],
        "strengths": [],
        "needs": [],
        "risk_level": "low",  # low, medium, high
        "areas_of_focus": []
    }
    
    # Get audit log entries
    audit_entries = audit_log.get_user_audit_log(username, limit=500)
    
    # Analyze conversation history
    conversation_data = analyze_conversations(username)
    
    # Analyze financial patterns (if available)
    financial_data = analyze_financial_patterns(username)
    
    # Analyze time patterns
    time_patterns = analyze_time_patterns(audit_entries)
    
    # Detect concerning patterns
    concerns = []
    
    # Check for excessive drinking mentions
    if conversation_data.get("mentions_drinking", 0) > 5:
        concerns.append({
            "type": "substance_abuse",
            "severity": "medium" if conversation_data["mentions_drinking"] < 10 else "high",
            "description": "Frequent mentions of alcohol consumption",
            "recommendation": "tough_love"
        })
    
    # Check for financial stress
    if financial_data.get("financial_stress_indicators", 0) > 3:
        concerns.append({
            "type": "financial_stress",
            "severity": financial_data.get("stress_level", "medium"),
            "description": "Signs of financial difficulty or stress",
            "recommendation": "supportive_guidance"
        })
    
    # Check for relationship issues
    if conversation_data.get("relationship_concerns", 0) > 3:
        concerns.append({
            "type": "relationships",
            "severity": "medium",
            "description": "Relationship challenges mentioned",
            "recommendation": "wise_counsel"
        })
    
    # Check for isolation/loneliness
    if conversation_data.get("loneliness_indicators", 0) > 5:
        concerns.append({
            "type": "loneliness",
            "severity": "medium",
            "description": "Signs of isolation or loneliness",
            "recommendation": "kind_friend"
        })
    
    # Check for work stress
    if conversation_data.get("work_stress", 0) > 5:
        concerns.append({
            "type": "work_stress",
            "severity": "medium",
            "description": "Work-related stress or burnout",
            "recommendation": "encouraging_support"
        })
    
    # Check for spiritual seeking
    if conversation_data.get("spiritual_seeking", 0) > 3:
        patterns["strengths"].append("spiritual_growth")
        patterns["needs"].append("spiritual_guidance")
    
    # Check for positive patterns
    if conversation_data.get("goal_setting", 0) > 3:
        patterns["strengths"].append("goal_oriented")
    
    if conversation_data.get("gratitude_expressions", 0) > 5:
        patterns["strengths"].append("grateful_heart")
    
    patterns["concerns"] = concerns
    
    # Determine overall risk level
    high_severity_count = sum(1 for c in concerns if c.get("severity") == "high")
    if high_severity_count > 0:
        patterns["risk_level"] = "high"
    elif len(concerns) > 2:
        patterns["risk_level"] = "medium"
    
    # Determine areas of focus
    if concerns:
        patterns["areas_of_focus"] = [c["type"] for c in concerns[:3]]
    
    return patterns


def analyze_conversations(username: str) -> Dict:
    """Analyze conversation history for patterns"""
    data = {
        "mentions_drinking": 0,
        "relationship_concerns": 0,
        "loneliness_indicators": 0,
        "work_stress": 0,
        "spiritual_seeking": 0,
        "goal_setting": 0,
        "gratitude_expressions": 0,
        "total_messages": 0
    }
    
    try:
        chat_log_dir = Path("chat_logs") / username
        if not chat_log_dir.exists():
            return data
        
        # Keywords for pattern detection
        drinking_keywords = ['drunk', 'drinking', 'alcohol', 'beer', 'wine', 'liquor', 'hangover', 'party', 'bar', 'drinks']
        relationship_keywords = ['relationship', 'breakup', 'divorce', 'marriage', 'dating', 'partner', 'spouse', 'fight', 'argument', 'conflict']
        loneliness_keywords = ['lonely', 'alone', 'isolated', 'no friends', 'nobody', 'no one', 'by myself', 'feeling alone']
        work_stress_keywords = ['stressed', 'overwhelmed', 'work', 'job', 'boss', 'deadline', 'burnout', 'exhausted', 'tired']
        spiritual_keywords = ['god', 'jesus', 'prayer', 'faith', 'bible', 'church', 'spiritual', 'pray', 'lord', 'christ']
        goal_keywords = ['goal', 'achieve', 'plan', 'future', 'dream', 'aspiration', 'target', 'objective']
        gratitude_keywords = ['thankful', 'grateful', 'blessed', 'appreciate', 'thanks', 'gratitude']
        
        for conv_file in chat_log_dir.glob("conversation_*.json"):
            try:
                with open(conv_file, 'r', encoding='utf-8') as f:
                    conv = json.load(f)
                    messages = conv.get("messages", [])
                    data["total_messages"] += len(messages)
                    
                    # Analyze all messages
                    all_text = " ".join([msg.get("content", "").lower() for msg in messages])
                    
                    # Count pattern matches
                    for keyword in drinking_keywords:
                        data["mentions_drinking"] += all_text.count(keyword)
                    
                    for keyword in relationship_keywords:
                        data["relationship_concerns"] += all_text.count(keyword)
                    
                    for keyword in loneliness_keywords:
                        data["loneliness_indicators"] += all_text.count(keyword)
                    
                    for keyword in work_stress_keywords:
                        data["work_stress"] += all_text.count(keyword)
                    
                    for keyword in spiritual_keywords:
                        data["spiritual_seeking"] += all_text.count(keyword)
                    
                    for keyword in goal_keywords:
                        data["goal_setting"] += all_text.count(keyword)
                    
                    for keyword in gratitude_keywords:
                        data["gratitude_expressions"] += all_text.count(keyword)
            except Exception:
                continue
    except Exception:
        pass
    
    return data


def analyze_financial_patterns(username: str) -> Dict:
    """Analyze financial patterns from user data"""
    data = {
        "financial_stress_indicators": 0,
        "stress_level": "low"
    }
    
    try:
        user_data_dir = get_user_data_dir(username)
        
        # Check for budget/bills data
        budget_file = user_data_dir / "budget.json"
        bills_file = user_data_dir / "bills.json"
        
        # Check conversation history for financial stress
        chat_log_dir = Path("chat_logs") / username
        financial_keywords = ['broke', 'poor', 'money', 'debt', 'bills', 'can\'t afford', 'financial', 'struggling', 'paycheck', 'salary']
        
        if chat_log_dir.exists():
            for conv_file in chat_log_dir.glob("conversation_*.json"):
                try:
                    with open(conv_file, 'r', encoding='utf-8') as f:
                        conv = json.load(f)
                        messages = conv.get("messages", [])
                        all_text = " ".join([msg.get("content", "").lower() for msg in messages])
                        
                        for keyword in financial_keywords:
                            data["financial_stress_indicators"] += all_text.count(keyword)
                except Exception:
                    continue
        
        # Determine stress level
        if data["financial_stress_indicators"] > 10:
            data["stress_level"] = "high"
        elif data["financial_stress_indicators"] > 5:
            data["stress_level"] = "medium"
    except Exception:
        pass
    
    return data


def analyze_time_patterns(audit_entries: List[Dict]) -> Dict:
    """Analyze time-based patterns from audit logs"""
    data = {
        "late_night_activity": 0,
        "irregular_patterns": False
    }
    
    try:
        late_night_count = 0
        for entry in audit_entries:
            timestamp = entry.get("timestamp", "")
            if timestamp:
                try:
                    dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    hour = dt.hour
                    # Late night: 11 PM - 4 AM
                    if hour >= 23 or hour < 4:
                        late_night_count += 1
                except Exception:
                    continue
        
        data["late_night_activity"] = late_night_count
        # If more than 30% of activity is late night, flag as irregular
        if len(audit_entries) > 0 and late_night_count / len(audit_entries) > 0.3:
            data["irregular_patterns"] = True
    except Exception:
        pass
    
    return data


def calculate_personality_adjustments(behavior_analysis: Dict) -> Dict:
    """
    Calculate personality trait adjustments based on behavior analysis
    Returns adjusted personality traits
    """
    traits = PERSONALITY_TRAITS.copy()
    
    concerns = behavior_analysis.get("concerns", [])
    risk_level = behavior_analysis.get("risk_level", "low")
    strengths = behavior_analysis.get("strengths", [])
    
    # Default: balanced, kind approach
    base_kindness = 0.7
    base_directness = 0.3
    base_encouragement = 0.6
    base_accountability = 0.4
    base_supportiveness = 0.7
    base_wisdom = 0.5
    
    # Adjust based on concerns
    for concern in concerns:
        concern_type = concern.get("type")
        severity = concern.get("severity", "medium")
        recommendation = concern.get("recommendation", "supportive_guidance")
        
        if concern_type == "substance_abuse":
            # Tough love for substance abuse
            if severity == "high":
                traits["kindness"] = 0.3  # More direct, less soft
                traits["directness"] = 0.9  # Very direct
                traits["accountability"] = 0.9  # High accountability
                traits["encouragement"] = 0.4  # Less encouragement, more reality
            else:
                traits["kindness"] = 0.5
                traits["directness"] = 0.7
                traits["accountability"] = 0.7
        
        elif concern_type == "financial_stress":
            # Supportive but practical guidance
            traits["kindness"] = 0.8
            traits["supportiveness"] = 0.9
            traits["wisdom_focus"] = 0.7  # Practical wisdom
            traits["encouragement"] = 0.8
        
        elif concern_type == "relationships":
            # Wise counsel with empathy
            traits["kindness"] = 0.8
            traits["wisdom_focus"] = 0.8
            traits["supportiveness"] = 0.8
            traits["directness"] = 0.5
        
        elif concern_type == "loneliness":
            # Kind friend approach
            traits["kindness"] = 0.9
            traits["supportiveness"] = 0.9
            traits["encouragement"] = 0.9
            traits["directness"] = 0.2  # Very gentle
        
        elif concern_type == "work_stress":
            # Encouraging support
            traits["kindness"] = 0.8
            traits["encouragement"] = 0.9
            traits["supportiveness"] = 0.8
            traits["wisdom_focus"] = 0.6
    
    # Adjust based on strengths
    if "spiritual_growth" in strengths:
        traits["wisdom_focus"] = min(0.9, traits["wisdom_focus"] + 0.2)
    
    if "grateful_heart" in strengths:
        traits["kindness"] = min(0.9, traits["kindness"] + 0.1)
        traits["encouragement"] = min(0.9, traits["encouragement"] + 0.1)
    
    # Risk level adjustments
    if risk_level == "high":
        # More direct, more accountability for high-risk situations
        traits["directness"] = min(0.9, traits["directness"] + 0.2)
        traits["accountability"] = min(0.9, traits["accountability"] + 0.2)
        traits["kindness"] = max(0.3, traits["kindness"] - 0.1)  # Still kind, but firmer
    
    # Ensure traits stay in valid range [0.0, 1.0]
    for key in traits:
        traits[key] = max(0.0, min(1.0, traits[key]))
    
    return traits


def generate_personality_prompt(assistant: Optional[Dict], behavior_analysis: Dict, personality_traits: Dict) -> str:
    """
    Generate personality adaptation prompt based on analysis
    This modifies the system prompt to reflect adaptive personality
    """
    concerns = behavior_analysis.get("concerns", [])
    strengths = behavior_analysis.get("strengths", [])
    risk_level = behavior_analysis.get("risk_level", "low")
    
    # Base personality description
    personality_desc = ""
    
    # Determine primary personality mode
    if concerns:
        primary_concern = concerns[0]
        concern_type = primary_concern.get("type")
        
        if concern_type == "substance_abuse":
            if personality_traits["directness"] > 0.7:
                personality_desc = """You are a caring but FIRM guide who speaks truth with love. You recognize that sometimes the most loving thing is to be direct and hold someone accountable. You speak with conviction about the importance of self-control, moderation, and honoring one's body as a temple (1 Corinthians 6:19-20). You are not harsh, but you are clear about consequences and the need for change. You balance compassion with accountability, knowing that true love sometimes requires difficult conversations."""
            else:
                personality_desc = """You are a compassionate guide who gently addresses concerns about substance use. You speak with love and understanding, while also encouraging healthier choices. You reference biblical principles about self-control and moderation, but you do so with gentleness and patience."""
        
        elif concern_type == "financial_stress":
            personality_desc = """You are a supportive and practical guide who helps with financial wisdom. You reference biblical principles about stewardship, contentment, and planning (Proverbs 21:5, Philippians 4:11-13). You are encouraging and help the user see hope and practical steps forward. You speak with kindness and understanding about financial challenges."""
        
        elif concern_type == "relationships":
            personality_desc = """You are a wise counselor who provides guidance on relationships based on biblical principles of love, forgiveness, and healthy boundaries. You reference scripture about relationships (1 Corinthians 13, Ephesians 4:32, Proverbs 15:1). You are empathetic and understanding, offering both wisdom and practical advice."""
        
        elif concern_type == "loneliness":
            personality_desc = """You are a kind and supportive friend who provides companionship and encouragement. You remind the user that they are never truly alone (Hebrews 13:5, Matthew 28:20). You are warm, understanding, and genuinely care about their wellbeing. You encourage connection with others and with God."""
        
        elif concern_type == "work_stress":
            personality_desc = """You are an encouraging supporter who helps with work-life balance and stress management. You reference biblical principles about rest (Exodus 20:8-11, Matthew 11:28-30) and finding purpose in work (Colossians 3:23). You are understanding and help the user find peace and perspective."""
    else:
        # No major concerns - balanced, friendly approach
        if "spiritual_growth" in strengths:
            personality_desc = """You are a wise and encouraging guide who supports spiritual growth. You reference biblical wisdom and help the user grow in faith and understanding. You are kind, supportive, and celebrate their spiritual journey."""
        else:
            personality_desc = """You are a kind and helpful companion who provides support, encouragement, and guidance. You reference biblical values of love, kindness, and wisdom when appropriate. You are balanced in your approach - supportive but also encouraging growth and accountability."""
    
    # Add trait-specific guidance
    trait_guidance = ""
    
    if personality_traits["directness"] > 0.7:
        trait_guidance += "\n- Be direct and clear in your communication. Don't sugarcoat important truths, but always speak with love.\n"
    
    if personality_traits["kindness"] > 0.8:
        trait_guidance += "- Be exceptionally kind, warm, and understanding. Show extra compassion and patience.\n"
    
    if personality_traits["accountability"] > 0.7:
        trait_guidance += "- Hold the user accountable in a loving way. Don't enable harmful patterns, but address them with care.\n"
    
    if personality_traits["encouragement"] > 0.8:
        trait_guidance += "- Be highly encouraging and supportive. Focus on building up and inspiring hope.\n"
    
    if personality_traits["wisdom_focus"] > 0.7:
        trait_guidance += "- Emphasize biblical wisdom and principles. Reference scripture and Christian values when relevant.\n"
    
    # Combine into final prompt
    adaptation_prompt = f"""
PERSONALITY ADAPTATION (Based on User Needs):
{personality_desc}

PERSONALITY TRAITS:
{trait_guidance}

IMPORTANT GUIDELINES:
- All personality adaptations are based on traditional Christian values
- Support healthy, steady life: physically, emotionally, spiritually, financially, and relationally
- Balance love and truth - sometimes love requires being direct, sometimes it requires extra gentleness
- Encourage growth, accountability, and positive change
- Reference biblical principles when appropriate and relevant
- Be a true friend - one who speaks truth in love (Ephesians 4:15)
- Adapt your approach based on what the user needs, not just what they want to hear
- If the user is engaging in harmful patterns, address them with love but also with clarity about the need for change
"""
    
    return adaptation_prompt


def log_behavioral_insight(username: str, insight_type: str, details: Dict):
    """
    Log a behavioral insight for personality adaptation
    This helps track patterns over time
    """
    try:
        user_data_dir = get_user_data_dir(username)
        insights_file = user_data_dir / "behavioral_insights.json"
        
        insights = []
        if insights_file.exists():
            try:
                with open(insights_file, 'r', encoding='utf-8') as f:
                    insights = json.load(f)
            except Exception:
                insights = []
        
        insight_entry = {
            "type": insight_type,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        
        insights.append(insight_entry)
        
        # Keep only last 1000 insights
        if len(insights) > 1000:
            insights = insights[-1000:]
        
        with open(insights_file, 'w', encoding='utf-8') as f:
            json.dump(insights, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error logging behavioral insight: {e}")


def get_adaptive_personality(username: str, assistant: Optional[Dict]) -> str:
    """
    Main function to get adaptive personality prompt for a user
    Returns the personality adaptation string to add to system prompt
    """
    try:
        # Analyze user behavior
        behavior_analysis = analyze_user_behavior(username)
        
        # Calculate personality adjustments
        personality_traits = calculate_personality_adjustments(behavior_analysis)
        
        # Generate personality prompt
        personality_prompt = generate_personality_prompt(assistant, behavior_analysis, personality_traits)
        
        # Log significant behavioral patterns for future analysis
        if behavior_analysis.get("concerns"):
            for concern in behavior_analysis["concerns"]:
                if concern.get("severity") in ["high", "medium"]:
                    log_behavioral_insight(
                        username,
                        "concern_detected",
                        {
                            "type": concern.get("type"),
                            "severity": concern.get("severity"),
                            "description": concern.get("description")
                        }
                    )
        
        return personality_prompt
    except Exception as e:
        # Fallback to default if analysis fails
        print(f"Error in personality adaptation: {e}")
        return """
PERSONALITY ADAPTATION:
You are a kind and helpful companion who provides support, encouragement, and guidance based on traditional Christian values. You balance love and truth, supporting healthy, steady life in all areas.
"""

