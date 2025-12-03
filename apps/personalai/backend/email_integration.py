"""
Email Integration System
Allows Assist to connect to user's email and analyze patterns
to automatically create helpful tools and skills
"""

import imaplib
import smtplib
import email
from email.header import decode_header
from email.utils import parsedate_to_datetime
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import json
import logging
from datetime import datetime, timedelta
import re

logger = logging.getLogger(__name__)

class EmailIntegration:
    def __init__(self, username: str):
        self.username = username
        self.user_data_dir = Path("users_data") / username
        self.user_data_dir.mkdir(parents=True, exist_ok=True)
        self.config_file = self.user_data_dir / "email_config.json"
        self.analysis_file = self.user_data_dir / "email_analysis.json"
        
    def save_email_config(self, email_address: str, password: str, imap_server: str, 
                         imap_port: int = 993, smtp_server: str = None, smtp_port: int = 587):
        """Save email configuration (password should be encrypted in production)"""
        config = {
            "email": email_address,
            "imap_server": imap_server,
            "imap_port": imap_port,
            "smtp_server": smtp_server or imap_server.replace("imap", "smtp"),
            "smtp_port": smtp_port,
            "configured_at": datetime.now().isoformat()
        }
        
        # In production, encrypt password before storing
        # For now, store in separate secure file
        with open(self.config_file, "w") as f:
            json.dump(config, f, indent=2)
        
        # Store password separately (should be encrypted)
        password_file = self.user_data_dir / ".email_password"
        with open(password_file, "w") as f:
            f.write(password)  # TODO: Encrypt this
        
        return config
    
    def load_email_config(self) -> Optional[Dict]:
        """Load email configuration"""
        if not self.config_file.exists():
            return None
        
        with open(self.config_file, "r") as f:
            return json.load(f)
    
    def get_email_password(self) -> Optional[str]:
        """Get email password (should be decrypted in production)"""
        password_file = self.user_data_dir / ".email_password"
        if not password_file.exists():
            return None
        
        with open(password_file, "r") as f:
            return f.read().strip()  # TODO: Decrypt this
    
    def connect_imap(self) -> Optional[imaplib.IMAP4_SSL]:
        """Connect to IMAP server"""
        config = self.load_email_config()
        if not config:
            return None
        
        password = self.get_email_password()
        if not password:
            return None
        
        try:
            mail = imaplib.IMAP4_SSL(config["imap_server"], config["imap_port"])
            mail.login(config["email"], password)
            return mail
        except Exception as e:
            logger.error(f"Failed to connect to IMAP: {e}")
            return None
    
    def fetch_recent_emails(self, days: int = 30, limit: int = 100) -> List[Dict]:
        """Fetch recent emails for analysis"""
        mail = self.connect_imap()
        if not mail:
            return []
        
        emails = []
        try:
            mail.select("INBOX")
            
            # Search for emails from last N days
            date_since = (datetime.now() - timedelta(days=days)).strftime("%d-%b-%Y")
            status, messages = mail.search(None, f'SINCE {date_since}')
            
            if status != "OK":
                return []
            
            email_ids = messages[0].split()
            email_ids = email_ids[-limit:]  # Get most recent
            
            for email_id in email_ids:
                try:
                    status, msg_data = mail.fetch(email_id, "(RFC822)")
                    if status != "OK":
                        continue
                    
                    raw_email = msg_data[0][1]
                    email_message = email.message_from_bytes(raw_email)
                    
                    # Extract email data
                    subject = decode_header(email_message["Subject"])[0][0]
                    if isinstance(subject, bytes):
                        subject = subject.decode()
                    
                    from_addr = email_message["From"]
                    to_addr = email_message["To"]
                    date_str = email_message["Date"]
                    
                    # Parse date
                    try:
                        date = parsedate_to_datetime(date_str)
                    except:
                        date = datetime.now()
                    
                    # Get body
                    body = ""
                    if email_message.is_multipart():
                        for part in email_message.walk():
                            content_type = part.get_content_type()
                            if content_type == "text/plain":
                                body = part.get_payload(decode=True).decode()
                                break
                    else:
                        body = email_message.get_payload(decode=True).decode()
                    
                    emails.append({
                        "id": email_id.decode(),
                        "subject": subject or "",
                        "from": from_addr or "",
                        "to": to_addr or "",
                        "date": date.isoformat(),
                        "body": body[:1000]  # First 1000 chars
                    })
                except Exception as e:
                    logger.error(f"Error parsing email {email_id}: {e}")
                    continue
            
            mail.close()
            mail.logout()
        except Exception as e:
            logger.error(f"Error fetching emails: {e}")
        
        return emails
    
    def analyze_emails(self, emails: List[Dict]) -> Dict:
        """Analyze emails to understand user's profession and needs"""
        if not emails:
            return {}
        
        # Analyze patterns
        senders = {}
        subjects = []
        keywords = {}
        domains = {}
        
        for email_data in emails:
            # Track senders
            from_addr = email_data.get("from", "")
            if from_addr:
                sender_name = from_addr.split("<")[0].strip()
                sender_email = from_addr.split("<")[-1].split(">")[0] if "<" in from_addr else from_addr
                domain = sender_email.split("@")[-1] if "@" in sender_email else ""
                
                if sender_name:
                    senders[sender_name] = senders.get(sender_name, 0) + 1
                if domain:
                    domains[domain] = domains.get(domain, 0) + 1
            
            # Track subjects
            subject = email_data.get("subject", "").lower()
            subjects.append(subject)
            
            # Extract keywords
            text = f"{subject} {email_data.get('body', '')}".lower()
            words = re.findall(r'\b[a-z]{4,}\b', text)
            for word in words:
                keywords[word] = keywords.get(word, 0) + 1
        
        # Identify profession patterns
        profession_keywords = {
            "concert_promoter": ["booking", "artist", "venue", "tour", "show", "concert", "promoter", "agent", "talent"],
            "real_estate": ["property", "listing", "sale", "buyer", "seller", "mortgage", "closing"],
            "lawyer": ["case", "client", "legal", "court", "deposition", "brief", "motion"],
            "doctor": ["patient", "appointment", "medical", "diagnosis", "treatment", "prescription"],
            "freelancer": ["project", "client", "invoice", "deliverable", "deadline", "proposal"],
            "sales": ["lead", "prospect", "deal", "quota", "commission", "pipeline"],
        }
        
        profession_scores = {}
        for profession, terms in profession_keywords.items():
            score = sum(keywords.get(term, 0) for term in terms)
            profession_scores[profession] = score
        
        detected_profession = max(profession_scores.items(), key=lambda x: x[1])[0] if profession_scores else None
        
        # Get top senders
        top_senders = sorted(senders.items(), key=lambda x: x[1], reverse=True)[:10]
        top_domains = sorted(domains.items(), key=lambda x: x[1], reverse=True)[:10]
        
        analysis = {
            "total_emails": len(emails),
            "detected_profession": detected_profession,
            "profession_confidence": profession_scores.get(detected_profession, 0) if detected_profession else 0,
            "top_senders": [{"name": name, "count": count} for name, count in top_senders],
            "top_domains": [{"domain": domain, "count": count} for domain, count in top_domains],
            "common_keywords": sorted(keywords.items(), key=lambda x: x[1], reverse=True)[:20],
            "analyzed_at": datetime.now().isoformat()
        }
        
        # Save analysis
        with open(self.analysis_file, "w") as f:
            json.dump(analysis, f, indent=2)
        
        return analysis
    
    def generate_skill_suggestion(self, analysis: Dict) -> Optional[Dict]:
        """Generate skill/tool suggestion based on email analysis"""
        profession = analysis.get("detected_profession")
        if not profession:
            return None
        
        # Generate skill based on profession
        if profession == "concert_promoter":
            return {
                "skill_id": f"booking_manager_{self.username}",
                "name": "Concert Booking Manager",
                "description": "Automatically organizes booking offers from agents, prioritizes high-value artists, and tracks relationships with booking agents",
                "features": [
                    "Email organization by booking agent",
                    "Artist value prioritization",
                    "Relationship tracking with agents",
                    "Offer comparison and ranking",
                    "Automated response suggestions"
                ],
                "email_filters": {
                    "keywords": ["booking", "artist", "offer", "venue", "tour", "show"],
                    "senders": [sender["name"] for sender in analysis.get("top_senders", [])[:5]]
                },
                "priority_rules": {
                    "high_value_artists": True,
                    "known_agents": True,
                    "recent_activity": True
                }
            }
        
        # Add more profession-specific skills here
        return None

