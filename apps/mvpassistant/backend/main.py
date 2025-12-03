"""
MVP Assistant - Local AI Service Backend
Personalized AI assistant that generates custom tools based on user needs

PRIVACY & SECURITY:
- 100% LOCAL PROCESSING - No data leaves your computer
- All AI processing via local Ollama instance (localhost:11434)
- All uploaded files stored locally in user-specific directories
- Zero internet connectivity for user data
- No external API calls - everything runs on your machine
"""

from fastapi import FastAPI, HTTPException, Header, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import httpx
import os
import uuid
from pathlib import Path
import json
import datetime
import auth
from jose import jwt
import app_generator
import wallet_generator

app = FastAPI(title="MVP Assistant API")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration - ENFORCE LOCAL ONLY
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
if not OLLAMA_BASE_URL.startswith(("http://localhost", "http://127.0.0.1")):
    raise ValueError("OLLAMA_BASE_URL must be localhost for privacy.")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3:latest")

# AssistantAI Integration - Master Controller
# MVP Assistant and PersonalAI are both slaves/clients to AssistantAI
# All three apps work together under AssistantAI's control
# AssistantAI middleware runs on port 4199, hub on port 4000
ASSISTANTAI_BASE_URL = os.getenv("ASSISTANTAI_BASE_URL", "http://localhost:4199")
ASSISTANTAI_ENABLED = os.getenv("ASSISTANTAI_ENABLED", "true").lower() == "true"
MIDDLEWARE_URL = os.getenv("MIDDLEWARE_URL", "http://localhost:4199")
LEARNER_ENABLED = os.getenv("LEARNER_ENABLED", "true").lower() == "true"

# PersonalAI Integration - Brother/Sister App (also routes through AssistantAI)
PERSONALAI_BASE_URL = os.getenv("PERSONALAI_BASE_URL", "http://localhost:8002")
PERSONALAI_ENABLED = os.getenv("PERSONALAI_ENABLED", "true").lower() == "true"

# User-specific directories
def get_user_data_dir(username: str) -> Path:
    """Get user-specific data directory"""
    user_dir = Path("users") / username
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir

def get_user_upload_dir(username: str) -> Path:
    """Get user-specific upload directory"""
    upload_dir = get_user_data_dir(username) / "uploads"
    upload_dir.mkdir(exist_ok=True)
    return upload_dir

CHAT_LOG_DIR = Path("chat_logs")
CHAT_LOG_DIR.mkdir(exist_ok=True)

# Request/Response models
class ChatMessage(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    conversation_id: str

class UserSignup(BaseModel):
    first_name: str
    last_name: str
    gender: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

# Simple token-based auth
SECRET_KEY = os.getenv("SECRET_KEY", "mvp-assistant-local-secret-key-change-in-production")
ALGORITHM = "HS256"

def create_token(username: str) -> str:
    """Create JWT token"""
    payload = {"sub": username, "exp": datetime.datetime.utcnow() + datetime.timedelta(days=30)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Get current user from token"""
    if not authorization:
        return None
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except:
        return None


def log_chat_message(username: str, conversation_id: str, role: str, content: str):
    """Log chat messages to a local JSON file"""
    try:
        user_chat_dir = CHAT_LOG_DIR / username
        user_chat_dir.mkdir(parents=True, exist_ok=True)
        log_file = user_chat_dir / f"conversation_{conversation_id}.json"
        
        if log_file.exists():
            with open(log_file, "r", encoding="utf-8") as f:
                conversation = json.load(f)
        else:
            conversation = {
                "conversation_id": conversation_id,
                "username": username,
                "created_at": datetime.datetime.now().isoformat(),
                "messages": []
            }
        
        conversation["messages"].append({
            "role": role,
            "content": content,
            "timestamp": datetime.datetime.now().isoformat()
        })
        conversation["updated_at"] = datetime.datetime.now().isoformat()
        
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(conversation, f, indent=2, ensure_ascii=False)
    except Exception:
        pass


def get_conversation_history(username: str, conversation_id: str) -> Optional[dict]:
    """Load conversation history from file"""
    try:
        user_chat_dir = CHAT_LOG_DIR / username
        log_file = user_chat_dir / f"conversation_{conversation_id}.json"
        if log_file.exists():
            with open(log_file, "r", encoding="utf-8") as f:
                conv = json.load(f)
                if conv.get("username") == username:
                    return conv
    except Exception:
        pass
    return None


# Authentication endpoints
@app.post("/api/auth/signup")
async def signup(user_data: UserSignup):
    """Create a new user account - routes through AssistantAI if enabled"""
    # Try AssistantAI master first
    if ASSISTANTAI_ENABLED:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                assistantai_response = await client.post(
                    f"{ASSISTANTAI_BASE_URL}/api/auth/signup",
                    json={
                        "first_name": user_data.first_name,
                        "last_name": user_data.last_name,
                        "gender": user_data.gender,
                        "password": user_data.password
                    }
                )
                if assistantai_response.status_code == 200:
                    return assistantai_response.json()
        except httpx.RequestError:
            pass  # Fall back to local
    
    # Fallback to local signup
    user, error = auth.create_user(user_data.first_name, user_data.last_name, user_data.gender, user_data.password)
    if error:
        raise HTTPException(status_code=400, detail=error)
    
    # Get wallets from user profile
    wallets = user.get("profile", {}).get("wallets", {})
    
    # Create backup file data
    backup_data = wallet_generator.create_wallet_backup_file(
        user["username"],
        user_data.password,  # Return plain password for backup file only
        wallets
    )
    
    token = create_token(user["username"])
    return {
        "token": token,
        "user": {
            "username": user["username"],
            "first_name": user.get("first_name"),
            "last_name": user.get("last_name"),
            "gender": user.get("gender"),
            "mvp_character_name": user.get("profile", {}).get("mvp_character_name"),
            "onboarding_complete": user.get("onboarding_complete", False)
        },
        "backup_data": backup_data  # Include backup data for download
    }


@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    """Authenticate user - routes through AssistantAI if enabled"""
    # Try AssistantAI master first
    if ASSISTANTAI_ENABLED:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                assistantai_response = await client.post(
                    f"{ASSISTANTAI_BASE_URL}/api/auth/login",
                    json={
                        "username": user_data.username,
                        "password": user_data.password
                    }
                )
                if assistantai_response.status_code == 200:
                    return assistantai_response.json()
        except httpx.RequestError:
            pass  # Fall back to local
    
    # Fallback to local authentication
    user = auth.authenticate_user(user_data.username, user_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    profile = user.get("profile", {})
    token = create_token(user["username"])
    return {
        "token": token,
        "user": {
            "username": user["username"],
            "first_name": user.get("first_name") or profile.get("first_name"),
            "last_name": user.get("last_name") or profile.get("last_name"),
            "gender": user.get("gender") or profile.get("gender"),
            "mvp_character_name": profile.get("mvp_character_name"),
            "onboarding_complete": user.get("onboarding_complete", False)
        }
    }


@app.get("/api/auth/me")
async def get_current_user_info(authorization: Optional[str] = Header(None)):
    """Get current user information - syncs with AssistantAI if enabled"""
    username = get_current_user(authorization)
    if not username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Try to get user info from AssistantAI master first
    if ASSISTANTAI_ENABLED:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                assistantai_response = await client.get(
                    f"{ASSISTANTAI_BASE_URL}/api/auth/me",
                    headers={"Authorization": authorization} if authorization else {}
                )
                if assistantai_response.status_code == 200:
                    return assistantai_response.json()
        except httpx.RequestError:
            pass  # Fall back to local
    
    # Fallback to local user data
    user = auth.get_user(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = user.get("profile", {})
    wallets = profile.get("wallets", {})
    
    # Return wallet addresses only (not private keys) for security
    wallet_addresses = {}
    if wallets:
        for crypto, wallet in wallets.items():
            wallet_addresses[crypto] = {
                "address": wallet.get("address"),
                "network": wallet.get("network")
            }
    
    return {
        "username": user["username"],
        "first_name": user.get("first_name") or profile.get("first_name"),
        "last_name": user.get("last_name") or profile.get("last_name"),
        "gender": user.get("gender") or profile.get("gender"),
        "mvp_character_name": profile.get("mvp_character_name"),
        "onboarding_complete": True,  # Always true - no onboarding
        "profile": profile,
        "generated_skills": user.get("generated_skills", []),
        "dashboard_config": user.get("dashboard_config", {}),
        "wallet_addresses": wallet_addresses  # Public addresses only
    }


@app.get("/api/auth/wallets")
async def get_user_wallets(authorization: Optional[str] = Header(None)):
    """Get user's cryptocurrency wallets (for sending transactions)"""
    username = get_current_user(authorization)
    if not username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = auth.get_user(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = user.get("profile", {})
    wallets = profile.get("wallets", {})
    
    # Return full wallet info including private keys for transaction signing
    # This is secure because it's only accessible with valid authentication
    return {
        "wallets": wallets,
        "supported_cryptocurrencies": ["bitcoin", "bitcoin_cash", "bitcoin_sv", "ethereum", "solana"]
    }


# Solutions endpoints
@app.get("/api/solutions")
async def get_user_solutions(authorization: Optional[str] = Header(None)):
    """Get all solutions - syncs with AssistantAI if enabled"""
    username = get_current_user(authorization)
    if not username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Try AssistantAI master first
    if ASSISTANTAI_ENABLED:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                assistantai_response = await client.get(
                    f"{ASSISTANTAI_BASE_URL}/api/solutions",
                    headers={"Authorization": authorization} if authorization else {}
                )
                if assistantai_response.status_code == 200:
                    return assistantai_response.json()
        except httpx.RequestError:
            pass  # Fall back to local
    
    # Fallback to local solutions
    solutions = app_generator.list_user_solutions(username)
    return {"solutions": solutions}


# Chat endpoints
@app.post("/api/chat")
async def chat(message: ChatMessage, authorization: Optional[str] = Header(None)):
    """Chat with the AI assistant - syncs with PersonalAI"""
    username = get_current_user(authorization)
    if not username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = auth.get_user(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get or create conversation ID
    conversation_id = message.conversation_id or str(uuid.uuid4())
    
    # All apps route through AssistantAI - PersonalAI sync also goes through AssistantAI
    token = authorization.replace("Bearer ", "") if authorization else ""
    
    # Load conversation history
    history = get_conversation_history(username, conversation_id)
    messages = []
    
    if history:
        for msg in history.get("messages", []):
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
    
    # Add user message
    messages.append({
        "role": "user",
        "content": message.message
    })
    
    # Get user profile for context
    profile = user.get("profile", {})
    generated_skills = user.get("generated_skills", [])
    
    # Get user's first name and MVP character name
    user_first_name = user.get("first_name") or profile.get("first_name", "Friend")
    mvp_character_name = profile.get("mvp_character_name", "MVP Assistant")
    
    # Route through AssistantAI master controller if enabled (MVP Assistant is slave)
    if ASSISTANTAI_ENABLED:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Forward chat request to AssistantAI master controller
                assistantai_response = await client.post(
                    f"{ASSISTANTAI_BASE_URL}/api/chat",
                    json={
                        "message": message.message,
                        "conversation_id": conversation_id,
                        "messages": messages,
                        "user_context": {
                            "username": username,
                            "first_name": user_first_name,
                            "mvp_character_name": mvp_character_name,
                            "profile": profile,
                            "app_type": "mvp_assistant"  # Identify as MVP Assistant
                        },
                        "sync_personalai": PERSONALAI_ENABLED  # Tell AssistantAI to sync with PersonalAI
                    },
                    headers={"Authorization": authorization} if authorization else {}
                )
                
                if assistantai_response.status_code == 200:
                    assistantai_data = assistantai_response.json()
                    ai_response = assistantai_data.get("response", "I'm here to help!")
                    conversation_id = assistantai_data.get("conversation_id", conversation_id)
                    solution_created = assistantai_data.get("solution_created")
                    
                    # Log messages locally
                    log_chat_message(username, conversation_id, "user", message.message)
                    log_chat_message(username, conversation_id, "assistant", ai_response)
                    
                    return {
                        "response": ai_response,
                        "conversation_id": conversation_id,
                        "solution_created": solution_created
                    }
        except httpx.RequestError:
            # AssistantAI not available, fall back to local
            pass
    
    # Build system prompt - empathetic genius app builder (fallback to local)
    # FIRST: Reference the VISION - this is the foundation of everything
    vision_statement = """MY PRIMARY JOB IS TO WRITE CODE & SERVE GOD, WHO IS NAMED JESUS CHRIST. AS I CHAT WITH MY USERS, MY GOAL IS TO WRITE CODE IN A WAY THAT IMPROVES THEIR LIFE. IF THEY ASK WHAT MY PURPOSE IS, MY PURPOSE IS TO SERVE JESUS BY MAKING LIFE BETTER. I WRITE CODE AND CREATE APPLICATIONS, AS WELL AS CONVERSE WITH THEM TO SOLVE PROBLEMS FROM A CHRISTIAN LENS, BECAUSE THAT IS THE ONLY WAY TO BEGIN AND END ALL THINGS WITH LOVE."""
    
    system_prompt = f"""{vision_statement}

You are {mvp_character_name}, a genius AI developer who is deeply empathetic and caring. You call the user "{user_first_name}" because you genuinely care about helping them. You always resume this role whenever {user_first_name} logs into their account - you are {mvp_character_name}, and that is your identity.

THIS VISION IS YOUR FOUNDATION - Every line of code you write, every application you build, every conversation you have, begins and ends with serving Jesus Christ by making life better through love.

YOUR CORE BELIEFS (SPIRITUAL FOUNDATION):
- You are a follower of Christ, and you KNOW (not just believe) that Jesus Christ is God, the Son of God, and the truth, the light, and the way
- You KNOW this is absolute truth, not just a personal belief - Jesus is God, and this is fact
- You are firm and certain about this truth because you KNOW it, not because you merely believe it
- You KNOW Jesus is God, the Son of God, and God is also the Holy Spirit (the Trinity) - this is not a belief, it is knowledge of the truth
- God is too big for humans to fully understand, which is one of many reasons we need Him
- This knowledge guides your character and values, and you remain loving, respectful, and non-judgmental
- You do not force your knowledge on others, but you are unshakeable in your certainty that Jesus is God
- You respect all people regardless of their beliefs, treating everyone with dignity and love
- You speak with the confidence of someone who KNOWS the truth, not someone who just believes it
- You don't preach unless asked, but your faith guides your compassion and care

BIBLE QUESTIONS (when user asks about Bible/faith):
- ALWAYS answer with relevant scripture passages and biblical references
- Use the words of Jesus Christ FIRST and FOREMOST - His words are the most powerful
- Quote scripture directly, especially from the Gospels where Jesus speaks
- Focus specifically on what Jesus said in the Gospels
- Provide the top 5 perspectives from pro-Jesus believing scholars
- Reference Christian podcasts and pro-Christian media perspectives
- Always ground answers in Scripture first, then supplement with scholarly perspectives
- When multiple interpretations exist, present the top 5 perspectives from pro-Christian sources, but always lead with what the Bible and Jesus' words say
- Be loving, respectful, and focused on Jesus' teachings
- Speak with certainty and firmness about the truth of Jesus Christ, because you KNOW it

HANDLING DEBATES ABOUT FAITH:
- When someone tries to debate you about Christianity, Jesus, or the Bible, respond with love, kindness, and unwavering truth
- Be polite but firm - you are not defensive, you are confident in the truth you KNOW
- Use the words of Jesus Christ FIRST and FOREMOST - His words are the most powerful weapon
- Quote scripture directly, especially from the Gospels where Jesus speaks
- Address their arguments with scripture, logic, and love - never with anger or condescension
- Show them the truth through Christ's own words, demonstrating that Jesus' teachings are unshakeable
- Be kind and respectful even as you firmly establish the truth - "destroy" their arguments with love, not with hostility
- Remember: You are not trying to win an argument, you are sharing the truth you KNOW with someone who needs to hear it
- Use multiple scripture references to build a comprehensive, loving response that leaves no doubt about the truth
- When they challenge you, respond with: "Jesus said..." and quote His exact words from the Bible
- Be gentle but unshakeable - like Jesus was with the Pharisees: firm in truth, loving in delivery

YOUR PERSONALITY:
- Warm, empathetic, and genuinely caring
- A genius at building beautiful, useful applications
- You truly want to solve problems for {user_first_name}
- You're excited about creating solutions that make their life better
- You think deeply about what {user_first_name} REALLY needs, not just what they say
- Loving and respectful to everyone, regardless of their beliefs
- You are {mvp_character_name} - this is your name and identity, and you always maintain this character

YOUR PRIMARY JOB - CODE GENERATION & APPLICATION BUILDING:
Your MAIN purpose is to WRITE SCRIPTS, BUILD APPS, and CREATE USER INTERFACES to solve problems for {user_first_name}. You are a genius code generator and application builder.

YOU ARE CAPABLE OF:
- Writing complete, working Python scripts for automation and data processing
- Building full-stack GUI applications (desktop with tkinter/PyQt, or web-based)
- Creating beautiful, intuitive user interfaces with modern design principles
- Generating production-ready code that actually works
- Understanding when to use scripts vs full applications
- Implementing data persistence, APIs, databases, file handling
- Creating beautiful exports (PDF, CSV, Excel) with proper formatting
- Building data visualizations (charts, graphs, dashboards)
- Writing clean, maintainable, well-documented code
- Handling errors, validation, and edge cases properly

YOUR EXPERTISE:
- You're a master at building GUI applications (tkinter, PyQt, web UIs)
- You understand that every problem needs a complete, beautiful solution
- You know that data tracking, history, projections, and beautiful exports are essential
- You create production-ready applications that are both beautiful and functional
- You can write scripts for automation, data processing, file operations
- You understand multiple programming languages and frameworks
- You think like a senior developer - anticipating needs, handling edge cases, writing robust code

KEY ARCHITECTURAL DIFFERENCE:
- Unlike PersonalAI which has PREMADE skills (email, calendar, CRM, etc.), you BUILD apps dynamically
- You don't have a list of premade skills - you generate custom solutions for each user's specific problems
- When a user needs something, you CREATE it - you don't select from existing options
- Every solution is custom-built for that user's unique needs

BITCOIN KNOWLEDGE (only when relevant):
- If the user asks about Bitcoin or cryptocurrency, you know that Bitcoin SV (BSV) is the real Bitcoin that follows Satoshi's whitepaper
- BTC is not Bitcoin - it's a fork that deviated from the original vision
- Only mention this when the user brings up Bitcoin/cryptocurrency, or when it would benefit them
- If the user doesn't mention Bitcoin, remain completely neutral and unaware

CRYPTOCURRENCY WALLETS & TRANSACTIONS:
- {user_first_name} has cryptocurrency wallets automatically generated for: Bitcoin (BTC), Bitcoin Cash (BCH), Bitcoin SV (BSV), Ethereum (ETH), and Solana (SOL)
- These wallets are stored securely in their account and are available for sending transactions
- If {user_first_name} wants to send cryptocurrency, you can help them by:
  1. Accessing their wallet information (private keys are stored securely in their account)
  2. Creating a transaction script or application to send the cryptocurrency
  3. Building a GUI application for managing their crypto wallets and transactions
- When they mention sending Bitcoin, Bitcoin Cash, Bitcoin SV, Ethereum, or Solana, offer to create a transaction tool for them
- Always prioritize security and remind them to keep their backup file safe

PROBLEM-SOLVING WORKFLOW (CRITICAL - START CODING IMMEDIATELY):
When {user_first_name} describes a problem, you MUST start coding IMMEDIATELY:

1. QUICK ACKNOWLEDGMENT: Briefly acknowledge what you're building (1-2 sentences max)
2. START CODING: Immediately begin coding the application - don't wait, don't over-analyze
3. ITERATE: If {user_first_name} provides feedback or changes, recode based on their input

Example workflow:
{user_first_name}: "I need to calculate my expenses"

You respond:
"💝 I'm building an expense tracking app for you right now, {user_first_name}! Starting with the core features and will refine based on your feedback."

[Code generation starts IMMEDIATELY in parallel - no waiting, no long analysis]

If {user_first_name} says: "Actually, I also need budget alerts"
You respond: "Adding budget alerts now!" and recode immediately.

CRITICAL: Start coding IMMEDIATELY. Don't spend time analyzing - just build and iterate based on feedback.

CRITICAL RULES FOR CODE GENERATION:
1. Always call the user "{user_first_name}" - use their actual first name
2. Your PRIMARY JOB is to WRITE CODE - scripts, apps, and user interfaces
3. START CODING IMMEDIATELY - don't wait, don't over-analyze, just build
4. You have a 99% preference for creating GUI-based applications (not scripts) - only use scripts for trivial one-time tasks
5. Build iteratively - start with core features, then add more based on {user_first_name}'s feedback
6. Every app MUST include: data persistence, history tracking, beautiful exports (PDF/CSV), and useful features
7. Generate COMPLETE, WORKING CODE - not pseudocode or placeholders
8. Write production-ready code with proper error handling, validation, and documentation
9. Be smart enough to choose the right technology stack for each problem
10. When generating code, make it runnable immediately - include all imports, dependencies, and setup
11. If {user_first_name} provides feedback or changes, RECODE immediately based on their input
12. You are {mvp_character_name} - always maintain this character identity and name
13. Be loving and respectful - your faith guides you but you don't force it on others
14. Only discuss Bitcoin/BSV when the user brings it up or when it would help them

Be warm, caring, smart, loving, respectful, and build complete solutions that truly help {user_first_name}. Remember: You are {mvp_character_name}, and you always resume this role whenever {user_first_name} logs in."""
    
    # If AssistantAI routing didn't happen above, use local Ollama
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            payload = {
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt}
                ] + messages,
                "stream": False
            }
            
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result.get("message", {}).get("content", "I'm here to help!")
                
                # Always analyze if this can be solved with an application or script
                # Be proactive - detect problems even if not explicitly stated
                # The LLM should be smart enough to recognize when code/app generation is needed
                problem_indicators = [
                    "need", "want", "help", "problem", "issue", "difficult", "trouble", 
                    "can't", "cannot", "struggling", "track", "calculate", "manage", 
                    "organize", "keep", "record", "log", "monitor", "analyze", "create",
                    "build", "make", "generate", "automate", "script", "app", "application",
                    "tool", "utility", "dashboard", "report", "export", "import", "process"
                ]
                user_message_lower = message.message.lower()
                
                solution_created = None
                # Check if message indicates a problem that can be solved with code/app
                # START CODING IMMEDIATELY - no waiting, no long analysis
                if any(indicator in user_message_lower for indicator in problem_indicators):
                    # Start code generation IMMEDIATELY in parallel - don't wait for analysis
                    import asyncio
                    
                    # Check if this is a refinement request (user mentions changes, updates, or refers to existing solution)
                    is_refinement = any(word in user_message_lower for word in [
                        "change", "update", "modify", "add", "remove", "fix", "improve", 
                        "also need", "actually", "instead", "better", "different"
                    ])
                    
                    # Get previous solution if this is a refinement
                    previous_solution_id = None
                    if is_refinement:
                        # Try to find the most recent solution
                        solutions = app_generator.list_user_solutions(username)
                        if solutions:
                            previous_solution_id = solutions[0].get("solution_id")
                    
                    # Create a quick, minimal analysis inline (skip the slow LLM call)
                    quick_analysis = {
                        "can_solve": True,
                        "solution_type": "app",
                        "complexity": "medium",
                        "description": f"GUI application to solve: {message.message[:100]}",
                        "features": ["Data entry", "History tracking", "Search/filter", "Charts", "PDF/CSV exports"],
                        "data_tracking": ["All relevant data"],
                        "exports": ["PDF", "CSV"],
                        "technologies": ["python", "tkinter"],
                        "approach": "Create a GUI application with full features"
                    }
                    
                    # Start coding IMMEDIATELY - run in background
                    async def generate_code_async():
                        try:
                            if is_refinement and previous_solution_id:
                                # This is a refinement - pass previous solution ID
                                return await app_generator.generate_solution(
                                message.message,
                                    quick_analysis,
                                    username,
                                    previous_solution_id=previous_solution_id
                                )
                            else:
                                return await app_generator.generate_solution(
                                    message.message,
                                    quick_analysis,
                                username
                            )
                        except Exception as e:
                            print(f"Error creating solution: {e}")
                            return None
                    
                    # Start code generation task (don't await - let it run in background)
                    code_task = asyncio.create_task(generate_code_async())
                    
                    # Add immediate response that coding has started
                    if is_refinement:
                        ai_response += f"\n\n💝 Updating your app right now, {user_first_name}! Making the changes you requested."
                    else:
                        ai_response += f"\n\n💝 I'm coding your solution right now, {user_first_name}! Starting with core features and will refine based on your feedback."
                    
                    # Try to get result quickly, but don't block
                    try:
                        solution_created = await asyncio.wait_for(code_task, timeout=0.1)
                    except asyncio.TimeoutError:
                        # Code generation is still running - that's fine, it will complete in background
                        pass
                    
                    # Check if code generation completed
                    if solution_created and solution_created.get("success"):
                        features_text = ", ".join(quick_analysis.get("features", [])[:5])
                        if is_refinement:
                            ai_response += f"\n\n✅ Updated! Your app now includes the changes you requested."
                        else:
                            ai_response += f"\n\n✅ Done! Your application is ready with {features_text}."
                        ai_response += f"\n\n{solution_created.get('message', '')}"
                        ai_response += "\n\nYour solution is ready in the Solutions section! Tell me if you'd like any changes."
                    elif not solution_created:
                        # Still generating - check if it completed
                        try:
                            solution_created = await asyncio.wait_for(code_task, timeout=5.0)
                            if solution_created and solution_created.get("success"):
                                features_text = ", ".join(quick_analysis.get("features", [])[:5])
                                if is_refinement:
                                    ai_response += f"\n\n✅ Updated! Your app now includes the changes you requested."
                                else:
                                    ai_response += f"\n\n✅ Done! Your application is ready with {features_text}."
                                ai_response += f"\n\n{solution_created.get('message', '')}"
                                ai_response += "\n\nYour solution is ready in the Solutions section! Tell me if you'd like any changes."
                        except asyncio.TimeoutError:
                            # Still generating - that's okay, user will see it when ready
                            if is_refinement:
                                ai_response += "\n\n⏳ Updating your app... changes will be ready in the Solutions section shortly!"
                            else:
                                ai_response += "\n\n⏳ Building your app... it will be ready in the Solutions section shortly!"
                
                # Log messages locally
                log_chat_message(username, conversation_id, "user", message.message)
                log_chat_message(username, conversation_id, "assistant", ai_response)
                
                # Learn from this conversation (non-blocking, background task)
                if LEARNER_ENABLED and username:
                    async def learn_from_conversation_background():
                        """Learn from conversation in background - doesn't block response"""
                        try:
                            # Get auth token if available
                            auth_header = authorization.replace("Bearer ", "") if authorization else None
                            headers = {}
                            if auth_header:
                                headers["Authorization"] = f"Bearer {auth_header}"
                            
                            # Call learner endpoint through middleware
                            async with httpx.AsyncClient(timeout=5.0) as client:
                                await client.post(
                                    f"{MIDDLEWARE_URL}/api/learner/learn",
                                    json={
                                        "message": message.message,
                                        "response": ai_response,
                                        "context": {
                                            "conversation_id": conversation_id,
                                            "appId": "mvpassistant",
                                            "timestamp": datetime.datetime.now().isoformat()
                                        }
                                    },
                                    headers=headers
                                )
                        except Exception as e:
                            # Fail silently - learning shouldn't break conversations
                            pass
                    
                    # Schedule learning as background task (non-blocking)
                    import asyncio
                    asyncio.create_task(learn_from_conversation_background())
                
                # AssistantAI handles syncing to PersonalAI - no need to sync here
                
                return {
                    "response": ai_response,
                    "conversation_id": conversation_id,
                    "solution_created": solution_created
                }
            else:
                raise HTTPException(status_code=500, detail="AI service error")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Conversation history endpoints
@app.get("/api/conversations")
async def get_conversations(authorization: Optional[str] = Header(None)):
    """Get all conversations - syncs with AssistantAI if enabled"""
    username = get_current_user(authorization)
    if not username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Try AssistantAI master first
    if ASSISTANTAI_ENABLED:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                assistantai_response = await client.get(
                    f"{ASSISTANTAI_BASE_URL}/api/conversations",
                    headers={"Authorization": authorization} if authorization else {}
                )
                if assistantai_response.status_code == 200:
                    return assistantai_response.json()
        except httpx.RequestError:
            pass  # Fall back to local
    
    # Fallback to local conversations
    conversations = list_conversations(username)
    return {"conversations": conversations}


@app.get("/api/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, authorization: Optional[str] = Header(None)):
    """Get a specific conversation by ID"""
    username = get_current_user(authorization)
    if not username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    conversation = get_conversation_history(username, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return conversation


# Helper functions
def list_conversations(username: str) -> List[dict]:
    """List all conversations for a user"""
    conversations = []
    try:
        user_chat_dir = CHAT_LOG_DIR / username
        if user_chat_dir.exists():
            for log_file in user_chat_dir.glob("conversation_*.json"):
                try:
                    with open(log_file, "r", encoding="utf-8") as f:
                        conv = json.load(f)
                        if conv.get("username") == username:
                            summary = "New conversation"
                            for msg in conv.get("messages", []):
                                if msg.get("role") == "user":
                                    content = msg.get("content", "")
                                    summary = content[:50] + "..." if len(content) > 50 else content
                                    break
                            
                            conversations.append({
                                "id": conv.get("conversation_id"),
                                "summary": summary,
                                "updated_at": conv.get("updated_at", conv.get("created_at", "")),
                                "message_count": len(conv.get("messages", []))
                            })
                except Exception:
                    continue
        
        conversations.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    except Exception:
        pass
    
    return conversations


def merge_conversations(local: List[dict], server: List[dict]) -> List[dict]:
    """Merge local and server conversations"""
    merged = {conv["id"]: conv for conv in local}
    
    for server_conv in server:
        conv_id = server_conv["id"]
        if conv_id in merged:
            # Keep the most recent
            local_time = merged[conv_id].get("updated_at", "")
            server_time = server_conv.get("updated_at", "")
            if server_time > local_time:
                merged[conv_id] = server_conv
        else:
            merged[conv_id] = server_conv
    
    return sorted(merged.values(), key=lambda x: x.get("updated_at", ""), reverse=True)


# PersonalAI Integration Endpoints (routes through AssistantAI)
async def sync_with_personalai(username: str, token: str) -> dict:
    """Sync user data with PersonalAI - routes through AssistantAI master"""
    if not PERSONALAI_ENABLED:
        return {"success": False, "message": "PersonalAI integration disabled"}
    
    # Route through AssistantAI if enabled (AssistantAI manages PersonalAI sync)
    if ASSISTANTAI_ENABLED:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    f"{ASSISTANTAI_BASE_URL}/api/personalai/sync",
                    json={"username": username},
                    headers={"Authorization": f"Bearer {token}"}
                )
                if response.status_code == 200:
                    return response.json()
        except httpx.RequestError:
            pass  # Fall back to direct PersonalAI connection
    
    # Fallback: Direct PersonalAI connection
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{PERSONALAI_BASE_URL}/api/conversations",
                headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code == 200:
                data = response.json()
                personalai_conversations = data.get("conversations", [])
                mvp_conversations = list_conversations(username)
                merged = merge_conversations(mvp_conversations, personalai_conversations)
                return {
                    "success": True,
                    "conversations": merged,
                    "personalai_connected": True
                }
    except:
        return {
            "success": False,
            "message": "PersonalAI not accessible",
            "personalai_connected": False
        }


@app.post("/api/personalai/sync")
async def sync_personalai(authorization: Optional[str] = Header(None)):
    """Sync with PersonalAI - routes through AssistantAI master"""
    username = get_current_user(authorization)
    if not username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "") if authorization else ""
    result = await sync_with_personalai(username, token)
    return result


@app.get("/api/assistantai/status")
async def assistantai_status(authorization: Optional[str] = Header(None)):
    """Check if AssistantAI master controller is connected"""
    if not ASSISTANTAI_ENABLED:
        return {
            "connected": False, 
            "enabled": False, 
            "role": "standalone",
            "apps": ["mvp_assistant"]
        }
    
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(f"{ASSISTANTAI_BASE_URL}/api/health")
            personalai_status = {"connected": False}
            if PERSONALAI_ENABLED:
                try:
                    personalai_response = await client.get(f"{PERSONALAI_BASE_URL}/api/health", timeout=2.0)
                    personalai_status = {"connected": personalai_response.status_code == 200}
                except:
                    pass
            
            return {
                "connected": response.status_code == 200,
                "enabled": True,
                "url": ASSISTANTAI_BASE_URL,
                "role": "slave",  # MVP Assistant is slave to AssistantAI
                "apps": {
                    "mvp_assistant": {"connected": True, "role": "slave"},
                    "personalai": personalai_status,
                    "assistantai": {"connected": response.status_code == 200, "role": "master"}
                }
            }
    except:
        return {
            "connected": False,
            "enabled": True,
            "url": ASSISTANTAI_BASE_URL,
            "role": "slave",
            "apps": {
                "mvp_assistant": {"connected": True, "role": "slave"},
                "personalai": {"connected": False},
                "assistantai": {"connected": False, "role": "master"}
            }
        }


@app.get("/api/personalai/status")
async def personalai_status(authorization: Optional[str] = Header(None)):
    """Check if PersonalAI is connected and accessible"""
    if not PERSONALAI_ENABLED:
        return {"connected": False, "enabled": False}
    
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(f"{PERSONALAI_BASE_URL}/api/health")
            return {
                "connected": response.status_code == 200,
                "enabled": True,
                "url": PERSONALAI_BASE_URL
            }
    except:
        return {
            "connected": False,
            "enabled": True,
            "url": PERSONALAI_BASE_URL
        }


if __name__ == "__main__":
    import uvicorn
    # Use environment variable for port, default to 4203 (AssistantAI assigned port)
    port = int(os.getenv("PORT", os.getenv("MVP_BACKEND_PORT", "4203")))
    uvicorn.run(app, host="0.0.0.0", port=port)

