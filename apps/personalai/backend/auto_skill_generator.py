"""
Automatic Skill/Tool Generator
Creates custom tools and skills for users based on their email patterns
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
from email_integration import EmailIntegration

logger = logging.getLogger(__name__)

class AutoSkillGenerator:
    def __init__(self, username: str):
        self.username = username
        self.user_data_dir = Path("users_data") / username
        self.user_data_dir.mkdir(parents=True, exist_ok=True)
        self.skills_dir = self.user_data_dir / "auto_skills"
        self.skills_dir.mkdir(parents=True, exist_ok=True)
        
    def create_booking_manager_skill(self, analysis: Dict) -> Dict:
        """Create concert booking manager skill"""
        skill_id = f"booking_manager_{self.username}"
        skill_file = self.skills_dir / f"{skill_id}.json"
        
        top_senders = analysis.get("top_senders", [])
        top_domains = analysis.get("top_domains", [])
        
        skill_config = {
            "skill_id": skill_id,
            "name": "Concert Booking Manager",
            "type": "email_organizer",
            "created_at": datetime.now().isoformat(),
            "description": "Automatically organizes booking offers from agents, prioritizes high-value artists, and tracks relationships with booking agents",
            "email_rules": {
                "priority_senders": [sender["name"] for sender in top_senders[:10]],
                "priority_domains": [domain["domain"] for domain in top_domains[:5]],
                "keywords": ["booking", "artist", "offer", "venue", "tour", "show", "concert", "promoter", "agent", "talent"],
                "value_indicators": ["guarantee", "fee", "budget", "offer", "rate", "price"]
            },
            "organization": {
                "group_by": "booking_agent",
                "sort_by": ["relationship_strength", "artist_value", "date"],
                "categories": ["high_priority", "medium_priority", "low_priority", "follow_up"]
            },
            "features": [
                "Auto-categorize emails by booking agent",
                "Prioritize offers from known agents",
                "Extract and rank artist offers by value",
                "Track relationship history with agents",
                "Generate response suggestions",
                "Create calendar events for important dates"
            ],
            "data_structure": {
                "offers": [],
                "agents": {},
                "artists": {},
                "relationships": {}
            }
        }
        
        with open(skill_file, "w") as f:
            json.dump(skill_config, f, indent=2)
        
        return skill_config
    
    def process_emails_for_skill(self, skill_config: Dict, emails: List[Dict]) -> Dict:
        """Process emails using the skill's rules"""
        skill_type = skill_config.get("type")
        
        if skill_type == "email_organizer":
            return self._organize_emails(skill_config, emails)
        
        return {"processed": 0, "organized": []}
    
    def _organize_emails(self, skill_config: Dict, emails: List[Dict]) -> Dict:
        """Organize emails based on skill rules"""
        rules = skill_config.get("email_rules", {})
        priority_senders = rules.get("priority_senders", [])
        keywords = rules.get("keywords", [])
        
        organized = {
            "high_priority": [],
            "medium_priority": [],
            "low_priority": [],
            "follow_up": []
        }
        
        agent_emails = {}
        
        for email_data in emails:
            from_addr = email_data.get("from", "")
            subject = email_data.get("subject", "").lower()
            body = email_data.get("body", "").lower()
            text = f"{subject} {body}"
            
            # Check if from priority sender
            is_priority_sender = any(sender.lower() in from_addr.lower() for sender in priority_senders)
            
            # Check for keywords
            keyword_matches = sum(1 for keyword in keywords if keyword in text)
            
            # Determine priority
            priority = "low_priority"
            if is_priority_sender and keyword_matches >= 2:
                priority = "high_priority"
            elif is_priority_sender or keyword_matches >= 2:
                priority = "medium_priority"
            
            # Extract agent name
            agent_name = from_addr.split("<")[0].strip() if "<" in from_addr else from_addr.split("@")[0]
            
            # Track agent relationship
            if agent_name not in agent_emails:
                agent_emails[agent_name] = {
                    "name": agent_name,
                    "email_count": 0,
                    "last_email": None,
                    "priority": "low"
                }
            
            agent_emails[agent_name]["email_count"] += 1
            agent_emails[agent_name]["last_email"] = email_data.get("date")
            if priority == "high_priority":
                agent_emails[agent_name]["priority"] = "high"
            elif priority == "medium_priority" and agent_emails[agent_name]["priority"] != "high":
                agent_emails[agent_name]["priority"] = "medium"
            
            # Add to organized list
            email_entry = {
                **email_data,
                "priority": priority,
                "agent": agent_name,
                "keyword_matches": keyword_matches
            }
            organized[priority].append(email_entry)
        
        # Update skill data
        skill_file = self.skills_dir / f"{skill_config['skill_id']}.json"
        if skill_file.exists():
            with open(skill_file, "r") as f:
                skill_data = json.load(f)
            
            skill_data["data_structure"]["agents"] = agent_emails
            skill_data["data_structure"]["offers"] = organized
            
            with open(skill_file, "w") as f:
                json.dump(skill_data, f, indent=2)
        
        return {
            "processed": len(emails),
            "organized": organized,
            "agents": agent_emails
        }
    
    def get_user_skills(self) -> List[Dict]:
        """Get all auto-generated skills for user"""
        skills = []
        for skill_file in self.skills_dir.glob("*.json"):
            try:
                with open(skill_file, "r") as f:
                    skills.append(json.load(f))
            except Exception as e:
                logger.error(f"Error loading skill {skill_file}: {e}")
        
        return skills

