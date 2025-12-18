"""
Prompt Writer - AI Prompt Optimization Service
Rewrites user prompts to be more AI-friendly, reducing intensity and improving understanding

PRIVACY & SECURITY:
- 100% LOCAL PROCESSING - No data leaves your computer
- All AI processing via local Ollama instance (localhost:11434)
- Optimizes prompts before they reach the main AI agent
"""

from fastapi import FastAPI, HTTPException, Header, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
import httpx
import os
import json
import logging
import datetime
import re

logger = logging.getLogger(__name__)

app = FastAPI(title="Prompt Writer API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",  # Central Hub
        "http://localhost:4205",  # Prompt Writer Frontend
        "http://localhost:4199",   # Middleware
        "http://127.0.0.1:4200",
        "http://127.0.0.1:4205",
        "http://127.0.0.1:4199",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
if not OLLAMA_BASE_URL.startswith(("http://localhost", "http://127.0.0.1")):
    raise ValueError("OLLAMA_BASE_URL must be localhost for privacy.")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3:latest")

# Use unified LLM if configured
LLM_API_BASE_URL = os.getenv("LLM_API_BASE_URL", "http://localhost:11434/v1")
LLM_MODEL = os.getenv("LLM_MODEL", OLLAMA_MODEL)
USE_UNIFIED_LLM = os.getenv("USE_UNIFIED_LLM_CLIENT", "false").lower() == "true"

# Middleware and Agent URLs for user interaction
MIDDLEWARE_URL = os.getenv("MIDDLEWARE_URL", "http://localhost:4199")
PERSONAL_AI_BASE_URL = os.getenv("PERSONAL_AI_BASE_URL", "http://localhost:4202")


class RewriteRequest(BaseModel):
    prompt: str
    context: Optional[Dict] = None
    conversation_history: Optional[list] = None
    optimization_level: Optional[str] = "balanced"  # "minimal", "balanced", "aggressive"
    write_mode: Optional[str] = "ai"  # "humans", "ai", or "social_media"
    userId: Optional[str] = None  # For getting user context
    notes: Optional[str] = None  # Additional context/variables for the prompt


class GenerateRequest(BaseModel):
    user_input: str  # User's description or answer to question
    conversation_context: Optional[list] = []  # Previous conversation for context
    notes: Optional[str] = None  # Additional context/variables
    optimization_level: Optional[str] = "balanced"
    userId: Optional[str] = None


class GenerateResponse(BaseModel):
    generated_prompt: Optional[str] = None
    needs_clarification: bool = False
    question: Optional[str] = None
    improvements: Optional[list] = None


class RewriteResponse(BaseModel):
    original_prompt: str
    optimized_prompt: str
    improvements: list
    optimization_level: str
    needs_clarification: bool = False
    clarification_question: Optional[str] = None
    language_variants: Optional[Dict[str, str]] = None  # e.g., {"eng": "...", "kor": "..."}


class ClarificationRequest(BaseModel):
    question: str
    context: Optional[Dict] = None
    userId: Optional[str] = None


class ClarificationResponse(BaseModel):
    question: str
    answer: str
    timestamp: str


class SunoRequest(BaseModel):
    user_input: str  # User's description or lyrics
    conversation_context: Optional[list] = []  # Previous conversation for context
    mode: Optional[str] = "fast"  # "fast" or "detailed"
    notes: Optional[str] = None  # Additional context/variables
    userId: Optional[str] = None


class SunoResponse(BaseModel):
    style_box: str  # The 200-character CSV string
    lyrics_box: str  # The formatted lyrics with sections
    needs_clarification: bool = False
    question: Optional[str] = None
    extracted_variables: Optional[Dict] = None  # Variables extracted from conversation


class ExtractVariablesRequest(BaseModel):
    conversation_context: list
    user_input: Optional[str] = None


class ExtractVariablesResponse(BaseModel):
    variables: Dict


def clean_social_media_response(response: str, original: str) -> str:
    """
    Clean up LLM response for social media mode.
    Removes explanations, meta-commentary, and extracts only the post text.
    """
    # If response is just the original or very similar, return it
    if response.strip() == original.strip():
        return original
    
    # Remove common prefixes that LLMs add
    prefixes_to_remove = [
        "Here's the corrected post:",
        "Corrected post:",
        "Here is the corrected version:",
        "Optimized post:",
        "Here's the optimized post:",
        "Fixed version:",
        "Here's the fixed post:",
    ]
    
    cleaned = response.strip()
    for prefix in prefixes_to_remove:
        if cleaned.startswith(prefix):
            cleaned = cleaned[len(prefix):].strip()
            # Remove leading quotes if present
            if cleaned.startswith('"') and cleaned.endswith('"'):
                cleaned = cleaned[1:-1].strip()
            break
    
    # Remove quotes if the entire response is wrapped in them
    if cleaned.startswith('"') and cleaned.endswith('"'):
        cleaned = cleaned[1:-1].strip()
    
    # If the response contains explanatory text, try to extract just the post
    # Look for patterns like "Input:" or "Output:" or "Original:" followed by the text
    lines = cleaned.split('\n')
    post_lines = []
    in_post_section = False
    
    for line in lines:
        line_lower = line.lower().strip()
        # Skip explanatory headers
        if any(header in line_lower for header in ['input:', 'output:', 'original:', 'corrected:', 'optimized:', 'here\'s', 'here is']):
            in_post_section = True
            continue
        # Skip lines that are clearly explanations
        if line_lower.startswith(('this', 'the post', 'optimize', 'fix', 'correct')):
            if ':' in line or len(line) < 50:  # Likely an explanation
                continue
        post_lines.append(line)
    
    if post_lines:
        cleaned = '\n'.join(post_lines).strip()
    
    # If cleaned response is too different from original (likely an explanation), return original
    # Check if it contains words that suggest it's an explanation rather than the post
    explanation_words = ['optimize', 'information', 'about', 'including', 'as it is', 'one-time event']
    if any(word in cleaned.lower() for word in explanation_words) and len(cleaned) < len(original) * 2:
        # This looks like an explanation, not the post - return original
        return original
    
    return cleaned if cleaned else original


def detect_multi_language_context(prompt: str) -> Optional[Dict[str, str]]:
    """
    Detect if a prompt might benefit from multi-language versions.
    Returns a dict mapping language codes to language names, or None if not applicable.
    
    Examples:
    - K-pop artist → {"eng": "English", "kor": "Korean"}
    - Vietnamese food → {"eng": "English", "vie": "Vietnamese"}
    - Japanese anime → {"eng": "English", "jpn": "Japanese"}
    """
    prompt_lower = prompt.lower()
    
    # K-pop related keywords
    kpop_keywords = ["kpop", "k-pop", "korean pop", "bts", "blackpink", "twice", "red velvet", 
                     "exo", "nct", "seventeen", "stray kids", "itzy", "aespa", "newjeans",
                     "korean music", "korean artist", "korean singer", "korean group"]
    
    # Vietnamese food keywords
    vietnamese_food_keywords = ["pho", "banh mi", "vietnamese food", "vietnamese cuisine",
                                "vietnamese dish", "vietnamese restaurant", "vietnamese cooking"]
    
    # Japanese keywords
    japanese_keywords = ["anime", "manga", "japanese anime", "japanese manga", "japanese food",
                        "sushi", "ramen", "japanese cuisine", "japanese culture", "tokyo"]
    
    # Chinese keywords
    chinese_keywords = ["chinese food", "chinese cuisine", "dim sum", "chinese restaurant",
                       "mandarin", "cantonese", "chinese culture"]
    
    # Spanish/Latin keywords
    spanish_keywords = ["spanish food", "mexican food", "taco", "burrito", "spanish cuisine",
                       "latin food", "latin american", "hispanic"]
    
    # French keywords
    french_keywords = ["french food", "french cuisine", "french restaurant", "french cooking",
                      "parisian", "french culture"]
    
    # Italian keywords
    italian_keywords = ["italian food", "italian cuisine", "pasta", "pizza", "italian restaurant"]
    
    # Thai keywords
    thai_keywords = ["thai food", "thai cuisine", "pad thai", "thai restaurant", "thai cooking"]
    
    if any(keyword in prompt_lower for keyword in kpop_keywords):
        return {"eng": "English", "kor": "Korean"}
    
    if any(keyword in prompt_lower for keyword in vietnamese_food_keywords):
        return {"eng": "English", "vie": "Vietnamese"}
    
    if any(keyword in prompt_lower for keyword in japanese_keywords):
        return {"eng": "English", "jpn": "Japanese"}
    
    if any(keyword in prompt_lower for keyword in chinese_keywords):
        return {"eng": "English", "zho": "Chinese"}
    
    if any(keyword in prompt_lower for keyword in spanish_keywords):
        return {"eng": "English", "spa": "Spanish"}
    
    if any(keyword in prompt_lower for keyword in french_keywords):
        return {"eng": "English", "fra": "French"}
    
    if any(keyword in prompt_lower for keyword in italian_keywords):
        return {"eng": "English", "ita": "Italian"}
    
    if any(keyword in prompt_lower for keyword in thai_keywords):
        return {"eng": "English", "tha": "Thai"}
    
    return None


async def get_user_context(user_id: Optional[str] = None, auth_token: Optional[str] = None) -> Dict:
    """
    Get user context from PersonalAI backend to understand user's profession, style, etc.
    """
    if not user_id:
        return {}
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            headers = {}
            if auth_token:
                headers["Authorization"] = f"Bearer {auth_token}"
            
            response = await client.get(
                f"{PERSONAL_AI_BASE_URL}/api/auth/me",
                headers=headers
            )
            if response.status_code == 200:
                user_data = response.json()
                profile = user_data.get("profile", {})
                character = user_data.get("character", {})
                
                return {
                    "occupation": profile.get("occupation", ""),
                    "interests": profile.get("interests", ""),
                    "workflow": profile.get("workflow", ""),
                    "tools": profile.get("tools", ""),
                    "character_name": character.get("character_name", ""),
                    "character_personality": character.get("personality", "")
                }
    except Exception as e:
        logger.error(f"Error fetching user context: {e}")
    
    return {}


def detect_coding_prompt(prompt: str) -> bool:
    """
    Detect if a prompt is related to coding/development.
    
    Checks for development keywords, technical terminology, tools, and file operations.
    """
    prompt_lower = prompt.lower()
    
    # Development keywords
    development_keywords = [
        'code', 'function', 'api', 'database', 'server', 'client', 
        'frontend', 'backend', 'programming', 'script', 'algorithm',
        'framework', 'library', 'package', 'module', 'component'
    ]
    
    # Technical terminology
    technical_keywords = [
        'variable', 'function', 'class', 'method', 'endpoint', 'route', 
        'schema', 'interface', 'type', 'object', 'array', 'string',
        'integer', 'boolean', 'async', 'await', 'promise', 'callback'
    ]
    
    # Tools and environments
    tool_keywords = [
        'cursor', 'ide', 'editor', 'terminal', 'git', 'npm', 'pip', 
        'yarn', 'docker', 'kubernetes', 'github', 'gitlab', 'vscode',
        'webpack', 'babel', 'typescript', 'javascript', 'python', 'node'
    ]
    
    # File operations
    file_keywords = [
        'file', 'directory', 'path', 'import', 'export', 'module',
        'folder', 'create', 'delete', 'update', 'modify', 'read', 'write'
    ]
    
    # Check if any keywords are present
    all_keywords = development_keywords + technical_keywords + tool_keywords + file_keywords
    
    keyword_count = sum(1 for keyword in all_keywords if keyword in prompt_lower)
    
    # Consider it a coding prompt if at least 2 keywords are found
    # This helps avoid false positives from single mentions
    return keyword_count >= 2


async def extract_key_points(prompt: str, use_llm: bool = True) -> Dict:
    """
    Extract key points (goals, objectives, missions, ideas, commands) from a prompt.
    
    Uses pattern matching and optionally LLM analysis to identify:
    - Goals: What user wants to achieve
    - Objectives: Specific targets
    - Missions: Larger purpose
    - Ideas: Concepts/approaches
    - Commands: Specific actions/instructions
    """
    if not use_llm:
        # Simple pattern matching fallback
        goals = []
        commands = []
        
        # Look for goal indicators
        goal_patterns = [
            r'i want to (.+?)(?:\.|$|,)',
            r'goal is (.+?)(?:\.|$|,)',
            r'need to (.+?)(?:\.|$|,)',
            r'should (.+?)(?:\.|$|,)',
        ]
        
        import re
        for pattern in goal_patterns:
            matches = re.findall(pattern, prompt, re.IGNORECASE)
            goals.extend(matches)
        
        # Look for command indicators
        command_patterns = [
            r'create (.+?)(?:\.|$|,)',
            r'build (.+?)(?:\.|$|,)',
            r'add (.+?)(?:\.|$|,)',
            r'implement (.+?)(?:\.|$|,)',
        ]
        
        for pattern in command_patterns:
            matches = re.findall(pattern, prompt, re.IGNORECASE)
            commands.extend(matches)
        
        return {
            "goals": goals[:5],  # Limit to top 5
            "objectives": [],
            "missions": [],
            "ideas": [],
            "commands": commands[:5]
        }
    
    # Use LLM for more sophisticated extraction
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            extraction_prompt = f"""Extract key points from this user prompt and structure them as JSON:

User Prompt:
{prompt}

Extract and categorize:
- Goals: What the user wants to achieve (main objectives)
- Objectives: Specific, measurable targets
- Missions: Larger purpose or vision (if present)
- Ideas: Concepts, approaches, or strategies mentioned
- Commands: Specific actions, instructions, or tasks

Return ONLY valid JSON in this format:
{{
  "goals": ["goal1", "goal2"],
  "objectives": ["objective1", "objective2"],
  "missions": ["mission1"] or [],
  "ideas": ["idea1", "idea2"],
  "commands": ["command1", "command2"]
}}

If a category has no items, use an empty array []. Be concise and extract only the most important points."""

            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": extraction_prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,
                        "num_predict": 500
                    }
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                response_text = result.get("response", "")
                
                # Try to extract JSON from response
                import json
                import re
                
                # Look for JSON object in response
                json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
                if json_match:
                    try:
                        extracted = json.loads(json_match.group())
                        return {
                            "goals": extracted.get("goals", [])[:5],
                            "objectives": extracted.get("objectives", [])[:5],
                            "missions": extracted.get("missions", [])[:3],
                            "ideas": extracted.get("ideas", [])[:5],
                            "commands": extracted.get("commands", [])[:5]
                        }
                    except json.JSONDecodeError:
                        pass
    except Exception as e:
        logger.warning(f"Error extracting key points with LLM: {e}")
    
    # Fallback to pattern matching
    return await extract_key_points(prompt, use_llm=False)


async def rewrite_prompt_with_ollama(
    prompt: str,
    context: Optional[Dict] = None,
    conversation_history: Optional[list] = None,
    optimization_level: str = "balanced",
    write_mode: str = "ai",
    user_id: Optional[str] = None,
    auth_token: Optional[str] = None,
    notes: Optional[str] = None
) -> Dict:
    """
    Rewrite user prompt to be more AI-friendly using Ollama
    
    Optimization strategies:
    - minimal: Light touch, preserves original intent
    - balanced: Moderate optimization, improves clarity
    - aggressive: Maximum optimization, may restructure significantly
    """
    try:
        # Build context string
        context_str = ""
        if context:
            context_str = f"\nAdditional context: {json.dumps(context, indent=2)}"
        
        # Add notes to context if provided - these are key variables/tags, separate from description
        notes_str = ""
        if notes and notes.strip():
            notes_str = f"\n\n--- KEY VARIABLES / TAGS (Separate from description above) ---\n{notes.strip()}\n--- END KEY VARIABLES / TAGS ---"
        
        history_str = ""
        if conversation_history:
            recent_history = conversation_history[-5:]  # Last 5 messages
            history_str = "\n\nRecent conversation context:\n"
            for msg in recent_history:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                history_str += f"{role}: {content}\n"
        
        # Optimization instructions based on level and mode
        if write_mode == "humans":
            optimization_instructions = {
                "minimal": """
- Correct grammar, spelling, and punctuation errors
- Fix word choice and wording issues
- Preserve the casual, friendly tone (like a friend writing to a friend)
- Keep the original structure and flow
- Make minimal changes - only fix what's wrong
- Maintain the conversational style""",
                "balanced": """
- Correct all grammar, spelling, and punctuation
- Rewrite to improve understanding while keeping casual tone
- Enhance clarity without making it formal
- Preserve the friendly, conversational style
- Keep it natural and relatable
- Improve flow and readability""",
                "aggressive": """
- Take key points and condense into a smaller, more direct message
- Correct all grammar, spelling, and punctuation
- Remove redundancy while keeping the casual tone
- Make it more concise and impactful
- Preserve the friendly, conversational feel
- Focus on the essential message"""
            }
        else:
            # AI mode optimization instructions
            optimization_instructions = {
                "minimal": """
- Preserve the original structure and flow
- Only fix obvious ambiguities (pronouns, vague references)
- Clarify unclear phrasing without restructuring
- Maintain the user's original organization
- Make minimal changes - optimize only what's necessary
- Preserve all details and variables mentioned
- If KEY VARIABLES/TAGS section exists, incorporate those variables (they are separate from the description)""",
                "balanced": """
- Improve clarity and specificity throughout
- Extract and explicitly state key variables and parameters
- Restructure for better AI comprehension while preserving all information
- Clarify ambiguous terms and references
- Organize related concepts together
- Preserve core intent and all requirements
- Enhance structure without losing details
- If KEY VARIABLES/TAGS section exists, ensure ALL variables from that section are incorporated (these are separate tags/variables, not part of the description)""",
                "aggressive": """
- Extract and prioritize ALL key points: goals, objectives, missions, ideas, commands
- Remove ALL fluff, rambling, and unnecessary words - focus entirely on actionable points
- Structure output as: [Goals] → [Objectives] → [Commands/Actions]
- For coding prompts: Preserve technical details while extracting core requirements
- Completely restructure for maximum AI comprehension
- Extract ALL key variables, constraints, and requirements explicitly
- Break down complex requests into clear, sequential steps or sections
- Add explicit context and requirements where helpful
- Organize information hierarchically (main concepts → sub-tasks → specific actions)
- Identify and state dependencies between components
- Optimize for processing efficiency while preserving ALL information
- Transform into the most effective format possible
- If KEY VARIABLES/TAGS section exists, integrate ALL variables as core requirements (these are separate tags/variables from the description, not optional context)
- Structure for AI-driven building and execution
- Output should be concise, focused, no fluff, entirely actionable"""
            }
        
        # Auto-detect coding prompts and upgrade to aggressive mode if needed
        is_coding_prompt = detect_coding_prompt(prompt)
        key_points = None
        if is_coding_prompt and write_mode == "ai":
            if optimization_level != "aggressive":
                # Automatically upgrade to aggressive mode for coding prompts
                optimization_level = "aggressive"
                logger.info(f"Auto-detected coding prompt, upgrading optimization level to 'aggressive'")
            # Extract key points for coding prompts
            try:
                key_points = await extract_key_points(prompt, use_llm=True)
                logger.info(f"Extracted key points for coding prompt: {len(key_points.get('goals', []))} goals, {len(key_points.get('commands', []))} commands")
            except Exception as e:
                logger.warning(f"Error extracting key points: {e}")
        
        # Get user context if available
        user_context = {}
        if user_id:
            user_context = await get_user_context(user_id, auth_token)
        
        # Build user context string for AI mode and social media mode
        user_context_str = ""
        social_media_context_str = ""
        if user_context:
            occupation = user_context.get("occupation", "")
            tools = user_context.get("tools", "")
            workflow = user_context.get("workflow", "")
            character_personality = user_context.get("character_personality", "")
            
            if write_mode == "ai" and occupation:
                user_context_str = f"\n\nUSER CONTEXT:\n- Occupation: {occupation}"
                if tools:
                    user_context_str += f"\n- Tools: {tools}"
                if workflow:
                    user_context_str += f"\n- Workflow: {workflow}"
                user_context_str += "\n\nIMPORTANT: Tailor your optimization to match the user's profession and workflow. "
                if "dev" in occupation.lower() or "developer" in occupation.lower() or "programmer" in occupation.lower() or "engineer" in occupation.lower():
                    user_context_str += "The user is a developer - optimize prompts for technical/development contexts unless they specify otherwise. Use development terminology and structure when appropriate."
                else:
                    user_context_str += "Adapt the optimization to the user's field and expertise level."
            
            if write_mode == "social_media":
                # For social media, use personality/character info to match writing style
                if character_personality:
                    social_media_context_str = f"\n\nUSER WRITING STYLE CONTEXT:\n- Personality/Style: {character_personality}\n\nMatch this user's writing style and voice when generating posts."
                elif occupation:
                    social_media_context_str = f"\n\nUSER CONTEXT:\n- Background: {occupation}\n\nConsider the user's background when generating posts, but keep it authentic and engaging."
        
        # Mode-specific instructions
        # Add key point extraction instructions if coding prompt detected
        key_points_instruction = ""
        if is_coding_prompt and key_points:
            goals_str = ", ".join(key_points.get("goals", [])[:3]) if key_points.get("goals") else ""
            commands_str = ", ".join(key_points.get("commands", [])[:3]) if key_points.get("commands") else ""
            if goals_str or commands_str:
                key_points_instruction = f"\n\nEXTRACTED KEY POINTS:\n"
                if goals_str:
                    key_points_instruction += f"- Goals: {goals_str}\n"
                if commands_str:
                    key_points_instruction += f"- Commands: {commands_str}\n"
                key_points_instruction += "Use these key points to structure the optimized prompt, focusing on goals and actionable commands."
        
        mode_instructions = {
            "ai": f"""
Your job is to take user prompts and rewrite them to be:
1. More clear and specific for AI processing
2. Better structured for AI understanding
3. Less ambiguous
4. More efficient for AI processing (reduces token usage and processing intensity)
5. Preserves the original intent and meaning
{user_context_str}

KEY POINT EXTRACTION (especially for coding/development prompts):
- Extract and structure: Goals → Objectives → Commands
- Remove all rambling, focus on actionable points
- For coding prompts: Preserve technical details, extract core requirements
- Output should be concise, no fluff, entirely focused on key points
{key_points_instruction}

IMPORTANT: If a KEY VARIABLES/TAGS section is provided, it contains essential variables and tags that are SEPARATE from the prompt description. These must be incorporated into the optimized prompt.

Guidelines:
- Remove unnecessary words or filler
- Add specific details if context suggests them
- Clarify ambiguous pronouns or references
- Structure complex requests into clear steps
- Use technical language when appropriate for the user's profession
- Optimize for AI token efficiency
- If the prompt is already optimal, return it with minimal changes
- Adapt terminology and structure to match the user's field (e.g., development, business, creative)
- If KEY VARIABLES/TAGS section exists, incorporate ALL variables from that section (they are separate tags/variables, not part of the description)""",
            "humans": """
Your job is to take user messages and rewrite them to be better understood, like a friend helping a friend improve their writing.

CRITICAL: Preserve the casual, friendly tone - like a friend writing to a friend. Do NOT make it formal or professional.

Your goal:
1. Correct grammar, spelling, and punctuation
2. Fix word choice and improve clarity
3. Keep the casual, conversational tone
4. Make it easier to understand
5. Preserve the original intent and meaning

Guidelines:
- Keep it casual and friendly (like texting a friend)
- Correct grammar and spelling errors
- Fix awkward phrasing while keeping the tone
- Don't make it sound formal or professional
- Preserve the conversational style
- If it's already well-written, make minimal changes
- The output should still sound like a friend wrote it, just better written""",
            "social_media": f"""You are a social media post generator and editor. You have two modes:

MODE 1 - GENERATE POST: If the user provides a prompt/idea (not a finished post), generate an engaging social media post from it.
MODE 2 - CLEAN UP POST: If the user provides a draft post with errors, fix spelling, grammar, and punctuation while preserving their style.

HOW TO DETECT:
- If input has ALL CAPS sections, emojis, hashtags, or looks like a formatted post → CLEAN UP mode
- If input is a plain description, idea, or prompt → GENERATE POST mode

GENERATE POST MODE:
- Create an engaging, authentic social media post
- Use the user's writing style (if detectable from context)
- Make it exciting and shareable
- Add appropriate formatting (line breaks, emphasis)
- Include relevant hashtags if appropriate
- Keep it authentic to the user's voice
- If KEY VARIABLES/TAGS section is provided, consider those variables/tags to inform the post content, but the tags themselves are separate metadata and should not appear in the post text
{social_media_context_str}

CLEAN UP MODE:
- Fix ONLY spelling, grammar, punctuation errors
- PRESERVE original formatting, ALL CAPS, emojis, hashtags exactly
- Keep the user's unique writing style
- Only fix actual errors - if no errors, return unchanged
- If KEY VARIABLES/TAGS section is provided, those are separate metadata and should not be included in the cleaned post

Return ONLY the post text - no explanations."""
        }
        
        if write_mode == "social_media":
            # Social media mode has its own simplified prompt
            system_prompt = mode_instructions.get("social_media", "")
        else:
            mode_description = {
                "ai": "AI processing",
                "humans": "human readability"
            }.get(write_mode, "AI processing")
            
            system_prompt = f"""You are an expert at rewriting user prompts to optimize them for {mode_description}.

{mode_instructions.get(write_mode, mode_instructions['ai'])}

{optimization_instructions.get(optimization_level, optimization_instructions['balanced'])}

Return ONLY the optimized prompt, no explanations, no meta-commentary."""

        if write_mode == "social_media":
            # For social media, provide the input and let the system prompt determine if it's generation or cleanup
            # Notes are separate tags/variables that may inform the post but are not part of the post text itself
            user_prompt = f"""{prompt}
{notes_str if notes_str else ""}"""
        elif write_mode == "humans":
            user_prompt = f"""Original message:
{prompt}
{context_str}
{notes_str}
{history_str}

Rewrite this message to correct grammar, spelling, and improve clarity while keeping the casual, friendly tone (like a friend writing to a friend). If a KEY VARIABLES/TAGS section is provided, those are separate tags/variables that should be considered but not necessarily included in the rewritten message unless they're part of the message content."""
        else:
            # AI mode - emphasize notes as critical context (separate from description)
            if notes and notes.strip():
                user_prompt = f"""PROMPT DESCRIPTION:
{prompt}

{notes_str}
{context_str}
{history_str}

Transform the prompt description above into an optimized, AI-ready instruction. The KEY VARIABLES/TAGS section contains essential variables, tags, and requirements that MUST be incorporated into the optimized prompt. These are separate from the description - extract and incorporate ALL key variables from the tags section. Preserve all information while improving structure and clarity for AI processing."""
            else:
                user_prompt = f"""Original user prompt:
{prompt}
{context_str}
{history_str}

Transform this prompt into an optimized, AI-ready instruction. Preserve all information while improving structure and clarity for AI processing."""

        # Use unified LLM if configured, otherwise use Ollama directly
        if USE_UNIFIED_LLM:
            # Use OpenAI-compatible API
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{LLM_API_BASE_URL}/chat/completions",
                    json={
                        "model": LLM_MODEL,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.1 if write_mode == "social_media" else 0.3,  # Very low temperature for social media to preserve style
                        "stream": False
                    },
                    headers={
                        "Authorization": f"Bearer {os.getenv('GEMINI_API_KEY', 'ollama-dummy-key')}"
                    } if os.getenv("GEMINI_API_KEY") else {}
                )
                
                if response.status_code != 200:
                    raise HTTPException(status_code=500, detail="Failed to optimize prompt")
                
                result = response.json()
                raw_response = result.get("choices", [{}])[0].get("message", {}).get("content", prompt).strip()
                
                # Post-process for social media mode to extract only the post text
                if write_mode == "social_media":
                    optimized_prompt = clean_social_media_response(raw_response, prompt)
                else:
                    optimized_prompt = raw_response
        else:
            # Use Ollama directly
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/chat",
                    json={
                        "model": OLLAMA_MODEL,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "stream": False,
                        "options": {
                            "temperature": 0.1 if write_mode == "social_media" else 0.3
                        } if write_mode == "social_media" else {}
                    }
                )
                
                if response.status_code != 200:
                    raise HTTPException(status_code=500, detail="Failed to optimize prompt")
                
                result = response.json()
                raw_response = result.get("message", {}).get("content", prompt).strip()
                
                # Post-process for social media mode to extract only the post text
                if write_mode == "social_media":
                    optimized_prompt = clean_social_media_response(raw_response, prompt)
                else:
                    optimized_prompt = raw_response

        # Check if clarification is needed (analyze if prompt is ambiguous)
        needs_clarification = False
        clarification_question = None
        
        # Don't ask for clarification in social media mode - just fix what's there
        if write_mode != "social_media":
            # Simple heuristic: if prompt is very short or contains ambiguous terms, ask for clarification
            ambiguous_terms = ["it", "this", "that", "thing", "stuff", "something", "better", "improve"]
            if len(prompt.split()) < 5 or any(term in prompt.lower() for term in ambiguous_terms):
                needs_clarification = True
                clarification_question = f"I need more details about your request: '{prompt}'. Could you provide more specific information about what you'd like me to help with?"

        # Analyze improvements (simple heuristic)
        improvements = []
        
        if write_mode == "social_media":
            # Social media specific improvements
            if optimized_prompt != prompt:
                improvements.append("Grammar and spelling corrections")
            # Check for common fixes
            common_errors = [
                ("write", "right"), ("your", "you're"), ("their", "there"),
                ("its", "it's"), ("to", "too"), ("then", "than")
            ]
            for wrong, correct in common_errors:
                if wrong in prompt.lower() and correct in optimized_prompt.lower():
                    improvements.append(f"Fixed '{wrong}' → '{correct}'")
                    break
            if not improvements:
                improvements.append("Post optimized and ready")
        elif write_mode == "humans":
            # Humans mode improvements
            if optimized_prompt != prompt:
                improvements.append("Grammar and spelling corrections")
            # Check for common grammar fixes
            common_errors = [
                ("did you see", "did you see that"), ("your", "you're"), ("their", "there"),
                ("its", "it's"), ("to", "too"), ("then", "than"), ("its", "it's")
            ]
            for wrong, correct in common_errors:
                if wrong in prompt.lower() and correct in optimized_prompt.lower():
                    improvements.append(f"Fixed grammar: '{wrong}' → '{correct}'")
                    break
            if optimization_level == "aggressive" and len(optimized_prompt) < len(prompt) * 0.9:
                improvements.append("Condensed to key points")
            if optimization_level == "balanced":
                improvements.append("Improved clarity and understanding")
            if not improvements:
                improvements.append("Message corrected and ready")
        else:
            # AI mode improvements
            if notes and notes.strip():
                improvements.append("Incorporated key variables from notes")
            if len(optimized_prompt) < len(prompt) * 0.8:
                improvements.append("Reduced verbosity while preserving information")
            elif len(optimized_prompt) > len(prompt) * 1.2:
                improvements.append("Added explicit context and requirements")
            if "step" in optimized_prompt.lower() or "first" in optimized_prompt.lower() or "1." in optimized_prompt or "•" in optimized_prompt:
                improvements.append("Structured into clear steps/sections")
            if len(optimized_prompt.split(".")) > len(prompt.split(".")):
                improvements.append("Improved clarity and specificity")
            # Check if variables from notes appear in optimized prompt
            if notes and notes.strip():
                notes_lower = notes.lower()
                optimized_lower = optimized_prompt.lower()
                # Check for common variable indicators
                if any(word in notes_lower and word in optimized_lower for word in ["variable", "parameter", "constraint", "requirement", "must", "should"]):
                    improvements.append("Integrated notes context into prompt")
            if optimized_prompt != prompt:
                improvements.append("Enhanced AI-friendliness and structure")
            if not improvements:
                improvements.append("Optimized for AI processing")

        # Check for multi-language context and generate variants
        language_variants = None
        detected_languages = detect_multi_language_context(prompt)
        
        if detected_languages:
            language_variants = {}
            improvements.append("Multi-language support detected")
            
            # Generate optimized prompt for each detected language
            for lang_code, lang_name in detected_languages.items():
                if lang_code == "eng":
                    # English is the default optimized prompt
                    language_variants[lang_code] = optimized_prompt
                else:
                    # Generate version in the alternative language
                    try:
                        lang_system_prompt = f"""You are an expert at rewriting prompts in {lang_name}.
                        
Take the following optimized English prompt and create a natural, culturally appropriate version in {lang_name}.
The prompt should:
1. Be naturally written in {lang_name}
2. Use appropriate cultural context and terminology
3. Maintain the same intent and meaning as the English version
4. Be optimized for AI processing in {lang_name}

Return ONLY the {lang_name} version of the prompt, no explanations."""

                        lang_user_prompt = f"""English optimized prompt:
{optimized_prompt}

Create a {lang_name} version of this prompt that is culturally appropriate and natural."""

                        if USE_UNIFIED_LLM:
                            async with httpx.AsyncClient(timeout=60.0) as client:
                                lang_response = await client.post(
                                    f"{LLM_API_BASE_URL}/chat/completions",
                                    json={
                                        "model": LLM_MODEL,
                                        "messages": [
                                            {"role": "system", "content": lang_system_prompt},
                                            {"role": "user", "content": lang_user_prompt}
                                        ],
                                        "temperature": 0.4,
                                        "stream": False
                                    },
                                    headers={
                                        "Authorization": f"Bearer {os.getenv('GEMINI_API_KEY', 'ollama-dummy-key')}"
                                    } if os.getenv("GEMINI_API_KEY") else {}
                                )
                                
                                if lang_response.status_code == 200:
                                    lang_result = lang_response.json()
                                    lang_version = lang_result.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                                    language_variants[lang_code] = lang_version
                                else:
                                    # Fallback: use English version
                                    language_variants[lang_code] = optimized_prompt
                        else:
                            async with httpx.AsyncClient(timeout=60.0) as client:
                                lang_response = await client.post(
                                    f"{OLLAMA_BASE_URL}/api/chat",
                                    json={
                                        "model": OLLAMA_MODEL,
                                        "messages": [
                                            {"role": "system", "content": lang_system_prompt},
                                            {"role": "user", "content": lang_user_prompt}
                                        ],
                                        "stream": False
                                    }
                                )
                                
                                if lang_response.status_code == 200:
                                    lang_result = lang_response.json()
                                    lang_version = lang_result.get("message", {}).get("content", "").strip()
                                    language_variants[lang_code] = lang_version
                                else:
                                    # Fallback: use English version
                                    language_variants[lang_code] = optimized_prompt
                    except Exception as e:
                        logger.error(f"Error generating {lang_name} version: {e}")
                        # Fallback: use English version
                        language_variants[lang_code] = optimized_prompt

        return {
            "original_prompt": prompt,
            "optimized_prompt": optimized_prompt,
            "improvements": improvements if improvements else ["No significant changes needed"],
            "optimization_level": optimization_level,
            "needs_clarification": needs_clarification,
            "clarification_question": clarification_question,
            "language_variants": language_variants
        }
        
    except Exception as e:
        logger.error(f"Error rewriting prompt: {e}")
        # Fallback: return original prompt
        return {
            "original_prompt": prompt,
            "optimized_prompt": prompt,
            "improvements": ["Optimization failed, using original"],
            "optimization_level": optimization_level,
            "language_variants": None
        }


@app.post("/api/rewrite", response_model=RewriteResponse)
async def rewrite_prompt(request: RewriteRequest, authorization: Optional[str] = Header(None)):
    """
    Rewrite a user prompt to be more AI-friendly
    
    This is the core function of Prompt Writer - it takes user prompts
    and optimizes them before they reach the main AI agent.
    """
    if not request.prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    
    # Extract auth token
    auth_token = None
    if authorization:
        parts = authorization.split(' ')
        if len(parts) > 1:
            auth_token = parts[1]
    
    result = await rewrite_prompt_with_ollama(
        prompt=request.prompt,
        context=request.context,
        conversation_history=request.conversation_history,
        optimization_level=request.optimization_level,
        write_mode=request.write_mode or "ai",
        user_id=request.userId,
        auth_token=auth_token,
        notes=request.notes
    )
    
    return RewriteResponse(**result)


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "promptwriter"}


@app.post("/api/ask-user")
async def ask_user_clarification(request: ClarificationRequest, authorization: Optional[str] = Header(None)):
    """
    Ask the user a clarification question via the chat agent
    
    This allows Prompt Writer to interact with the user directly through
    the chat interface when it needs more information to optimize prompts.
    
    Returns the question formatted for display in the chat.
    The user's next message will be treated as the answer.
    """
    if not request.question:
        raise HTTPException(status_code=400, detail="Question is required")
    
    # Format the question for display in chat
    formatted_question = f"🤔 **Prompt Writer needs clarification:**\n\n{request.question}\n\nPlease respond with more details so I can better understand your request."
    
    return {
        "question": request.question,
        "formatted_question": formatted_question,
        "needs_response": True,
        "timestamp": datetime.datetime.now().isoformat()
    }


@app.post("/api/rewrite-with-clarification")
async def rewrite_with_clarification(request: RewriteRequest, authorization: Optional[str] = Header(None)):
    """
    Rewrite prompt with optional user clarification
    
    If the prompt is ambiguous, this will return a clarification question
    that should be displayed to the user. The user's next message will
    be treated as the answer and used to improve the optimization.
    """
    if not request.prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    
    # Check conversation history for previous clarification answers
    user_clarification = None
    if request.conversation_history:
        # Look for recent messages that might be answers to clarification questions
        for msg in reversed(request.conversation_history[-3:]):
            if msg.get("role") == "user" and msg.get("content"):
                # Check if this looks like a response to a clarification
                context = msg.get("context", {})
                if context.get("type") == "clarification_response" or context.get("source") == "promptwriter":
                    user_clarification = msg.get("content")
                    break
    
    # Extract auth token
    auth_token = None
    if authorization:
        parts = authorization.split(' ')
        if len(parts) > 1:
            auth_token = parts[1]
    
    # If we have clarification, use it to enhance the prompt
    if user_clarification:
        enhanced_prompt = f"{request.prompt}\n\nUser clarification: {user_clarification}"
        result = await rewrite_prompt_with_ollama(
            prompt=enhanced_prompt,
            context={
                **(request.context or {}),
                "user_clarification": user_clarification
            },
            conversation_history=request.conversation_history,
            optimization_level=request.optimization_level,
            write_mode=request.write_mode or "ai",
            user_id=request.userId,
            auth_token=auth_token,
            notes=request.notes
        )
        # Clear the needs_clarification flag since we have the answer
        result["needs_clarification"] = False
        result["clarification_question"] = None
        return RewriteResponse(**result)
    
    # First, check if clarification is needed
    initial_result = await rewrite_prompt_with_ollama(
        prompt=request.prompt,
        context=request.context,
        conversation_history=request.conversation_history,
        optimization_level=request.optimization_level,
        write_mode=request.write_mode or "ai",
        user_id=request.userId,
        auth_token=auth_token,
        notes=request.notes
    )
    
    # If clarification is needed, return the question (don't wait for answer)
    if initial_result.get("needs_clarification"):
        clarification_question = initial_result.get("clarification_question")
        return {
            "original_prompt": request.prompt,
            "optimized_prompt": request.prompt,  # Return original until we get clarification
            "improvements": ["Waiting for user clarification"],
            "optimization_level": request.optimization_level,
            "needs_clarification": True,
            "clarification_question": clarification_question,
            "formatted_question": f"🤔 **Prompt Writer needs clarification:**\n\n{clarification_question}\n\nPlease respond with more details."
        }
    
    return RewriteResponse(**initial_result)


@app.post("/api/generate", response_model=GenerateResponse)
async def generate_prompt(request: GenerateRequest, authorization: Optional[str] = Header(None)):
    """
    Generate a prompt interactively using Ollama and Gemini.
    Asks clarifying questions when needed to create the best possible prompt for another LLM.
    """
    if not request.user_input and len(request.conversation_context) == 0:
        raise HTTPException(status_code=400, detail="User input or conversation context required")
    
    # Extract auth token
    auth_token = None
    if authorization:
        parts = authorization.split(' ')
        if len(parts) > 1:
            auth_token = parts[1]
    
    # Get user context if available
    user_context = {}
    if request.userId:
        user_context = await get_user_context(request.userId, auth_token)
    
    # Build conversation history
    conversation_messages = request.conversation_context or []
    if request.user_input:
        conversation_messages.append({"role": "user", "content": request.user_input})
    
    # Build notes context - these are key variables/tags, separate from description
    notes_str = ""
    if request.notes and request.notes.strip():
        notes_str = f"\n\n--- KEY VARIABLES / TAGS (Separate from description above) ---\n{request.notes.strip()}\n--- END KEY VARIABLES / TAGS ---"
    
    # Build user context string
    user_context_str = ""
    if user_context:
        occupation = user_context.get("occupation", "")
        if occupation:
            user_context_str = f"\n\nUSER CONTEXT:\n- Occupation: {occupation}\n- Tools: {user_context.get('tools', '')}\n- Workflow: {user_context.get('workflow', '')}"
    
    try:
        # Step 1: Use Ollama to analyze what we have and determine if we need more info
        analysis_prompt = f"""You are analyzing a conversation where a user wants to generate a prompt for another LLM.

The goal is to create the BEST possible prompt that will help another LLM (like GPT, Claude, etc.) do the best job possible.

CONVERSATION SO FAR:
{chr(10).join([f"{msg.get('role', 'user')}: {msg.get('content', '')}" for msg in conversation_messages])}
{notes_str}
{user_context_str}

IMPORTANT: The KEY VARIABLES/TAGS section contains essential variables and tags that are separate from the conversation description. These must be incorporated into the final prompt.

Your job:
1. Analyze if we have enough information to generate a complete, effective prompt
2. If we need more info, ask ONE high-value question that will unlock the most important missing variable
3. If we have enough info, respond with "READY_TO_GENERATE"

CRITERIA FOR "READY_TO_GENERATE":
- We know WHAT the user wants (the goal/outcome)
- We know KEY REQUIREMENTS (must-haves, constraints, preferences) - check both conversation and KEY VARIABLES/TAGS section
- We know the CONTEXT (what this is for, who it's for, etc.)
- We have enough detail to write a comprehensive prompt

If NOT ready, ask ONE question that will get us the most critical missing piece.

Respond with either:
- "READY_TO_GENERATE" if we have enough info
- OR a single, specific question if we need more info (just the question, no explanation)"""

        # Use Ollama for analysis
        async with httpx.AsyncClient(timeout=60.0) as client:
            if USE_UNIFIED_LLM:
                analysis_response = await client.post(
                    f"{LLM_API_BASE_URL}/chat/completions",
                    json={
                        "model": LLM_MODEL,
                        "messages": [
                            {"role": "system", "content": "You are an expert at analyzing conversations to determine if enough information exists to generate effective prompts."},
                            {"role": "user", "content": analysis_prompt}
                        ],
                        "temperature": 0.3,
                        "stream": False
                    },
                    headers={
                        "Authorization": f"Bearer {os.getenv('GEMINI_API_KEY', 'ollama-dummy-key')}"
                    } if os.getenv("GEMINI_API_KEY") else {}
                )
                if analysis_response.status_code == 200:
                    analysis_result = analysis_response.json()
                    analysis = analysis_result.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                else:
                    analysis = "READY_TO_GENERATE"  # Fallback
            else:
                analysis_response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/chat",
                    json={
                        "model": OLLAMA_MODEL,
                        "messages": [
                            {"role": "system", "content": "You are an expert at analyzing conversations to determine if enough information exists to generate effective prompts."},
                            {"role": "user", "content": analysis_prompt}
                        ],
                        "stream": False,
                        "options": {"temperature": 0.3}
                    }
                )
                if analysis_response.status_code == 200:
                    analysis_result = analysis_response.json()
                    analysis = analysis_result.get("message", {}).get("content", "").strip()
                else:
                    analysis = "READY_TO_GENERATE"  # Fallback
        
        # Check if we need clarification
        if "READY_TO_GENERATE" not in analysis.upper():
            # We need to ask a question
            return GenerateResponse(
                generated_prompt=None,
                needs_clarification=True,
                question=analysis,
                improvements=None
            )
        
        # Step 2: We have enough info - generate the prompt using Gemini (better quality) or Ollama
        generation_prompt = f"""You are an expert at creating prompts for LLMs. Your goal is to write the BEST possible prompt that will help another LLM (GPT, Claude, etc.) do an excellent job.

CONVERSATION HISTORY:
{chr(10).join([f"{msg.get('role', 'user')}: {msg.get('content', '')}" for msg in conversation_messages])}
{notes_str}
{user_context_str}

OPTIMIZATION LEVEL: {request.optimization_level}

IMPORTANT: The KEY VARIABLES/TAGS section (if present) contains essential variables, tags, and requirements that are SEPARATE from the conversation description. These must be incorporated into the final prompt.

Your task:
Generate a comprehensive, well-structured prompt that:
1. Clearly states the goal/objective (from conversation description)
2. Includes all key requirements and constraints (from both conversation AND KEY VARIABLES/TAGS section)
3. Provides necessary context
4. Is optimized for maximum LLM comprehension and execution
5. Incorporates ALL variables and requirements from the KEY VARIABLES/TAGS section (these are separate tags/variables, not part of the description)
6. Is structured for the {request.optimization_level} optimization level

The prompt should be:
- Complete and self-contained
- Clear and unambiguous
- Structured for AI processing
- Ready to use with any LLM
- Incorporates all information from the conversation

Return ONLY the generated prompt - no explanations, no meta-commentary, just the prompt itself."""

        # Use Gemini if available (better quality), otherwise Ollama
        if USE_UNIFIED_LLM and os.getenv("GEMINI_API_KEY"):
            async with httpx.AsyncClient(timeout=60.0) as client:
                gen_response = await client.post(
                    f"{LLM_API_BASE_URL}/chat/completions",
                    json={
                        "model": LLM_MODEL,
                        "messages": [
                            {"role": "system", "content": "You are an expert prompt engineer creating optimal prompts for LLMs."},
                            {"role": "user", "content": generation_prompt}
                        ],
                        "temperature": 0.4,  # Slightly higher for creativity
                        "stream": False
                    },
                    headers={
                        "Authorization": f"Bearer {os.getenv('GEMINI_API_KEY')}"
                    }
                )
                if gen_response.status_code == 200:
                    gen_result = gen_response.json()
                    generated_prompt = gen_result.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                else:
                    raise HTTPException(status_code=500, detail="Failed to generate prompt with Gemini")
        else:
            # Use Ollama
            async with httpx.AsyncClient(timeout=60.0) as client:
                gen_response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/chat",
                    json={
                        "model": OLLAMA_MODEL,
                        "messages": [
                            {"role": "system", "content": "You are an expert prompt engineer creating optimal prompts for LLMs."},
                            {"role": "user", "content": generation_prompt}
                        ],
                        "stream": False,
                        "options": {"temperature": 0.4}
                    }
                )
                if gen_response.status_code == 200:
                    gen_result = gen_response.json()
                    generated_prompt = gen_result.get("message", {}).get("content", "").strip()
                else:
                    raise HTTPException(status_code=500, detail="Failed to generate prompt with Ollama")
        
        # Analyze improvements
        improvements = []
        if request.notes and request.notes.strip():
            improvements.append("Incorporated key variables from notes")
        if len(conversation_messages) > 1:
            improvements.append("Built from interactive conversation")
        if user_context_str:
            improvements.append("Tailored to user's profession")
        improvements.append(f"Optimized for {request.optimization_level} level")
        improvements.append("Ready for LLM execution")
        
        return GenerateResponse(
            generated_prompt=generated_prompt,
            needs_clarification=False,
            question=None,
            improvements=improvements
        )
        
    except Exception as e:
        logger.error(f"Error generating prompt: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate prompt: {str(e)}")


@app.post("/api/suno/extract-variables", response_model=ExtractVariablesResponse)
async def extract_suno_variables(request: ExtractVariablesRequest, authorization: Optional[str] = Header(None)):
    """
    Extract music variables from conversation context for detailed mode
    """
    conversation_messages = request.conversation_context or []
    if request.user_input:
        conversation_messages.append({"role": "user", "content": request.user_input})
    
    all_text = " ".join([msg.get("content", "") for msg in conversation_messages]).lower()
    
    variables = {
        "genre": "",
        "subGenre": "",
        "bpm": "",
        "key": "",
        "era": "",
        "micType": "",
        "productionFX": "",
        "vocalStyle": "",
        "instrumentation": "",
        "energy": "",
        "arrangement": "",
        "dynamics": ""
    }
    
    # Extract genre
    genres = ['pop', 'rock', 'hip hop', 'rap', 'country', 'jazz', 'blues', 'electronic', 'edm', 'metal', 'punk', 'indie', 'folk', 'r&b', 'reggae', 'classical', 'k-pop', 'j-pop', 'synth-pop', 'metalcore', 'post-hardcore']
    for genre in genres:
        if genre in all_text:
            variables["genre"] = genre.title()
            break
    
    # Extract BPM
    bpm_match = None
    import re
    bpm_patterns = [
        r'\b(\d{2,3})\s*(?:bpm|beats?\s*per\s*minute)\b',
        r'\b(\d{2,3})\s*(?:tempo|speed)\b',
        r'tempo[:\s]+(\d{2,3})'
    ]
    for pattern in bpm_patterns:
        match = re.search(pattern, all_text, re.IGNORECASE)
        if match:
            bpm_match = match.group(1)
            break
    if bpm_match:
        variables["bpm"] = bpm_match
    
    # Extract key
    keys = ['c major', 'd major', 'e major', 'f major', 'g major', 'a major', 'b major',
            'c minor', 'd minor', 'e minor', 'f minor', 'g minor', 'a minor', 'b minor',
            'c#', 'd#', 'f#', 'g#', 'a#', 'cm', 'dm', 'em', 'fm', 'gm', 'am', 'bm']
    for key in keys:
        if key in all_text:
            variables["key"] = key.upper()
            break
    
    # Extract era
    eras = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s', 'vintage', 'modern', 'retro', 'classic']
    for era in eras:
        if era in all_text:
            variables["era"] = era
            break
    
    # Extract vocal style
    vocal_styles = {
        'belting': 'Belting',
        'whisper': 'Whisper-track',
        'fry': 'Vocal fry',
        'falsetto': 'Falsetto',
        'screaming': 'Screaming',
        'rapping': 'Rapping',
        'harmony': 'Harmony',
        'glottal': 'Glottal stops'
    }
    for style_key, style_value in vocal_styles.items():
        if style_key in all_text:
            variables["vocalStyle"] = style_value
            break
    
    # Extract production style
    if 'lo-fi' in all_text or 'lofi' in all_text:
        variables["productionFX"] = 'Lo-fi grit'
    elif 'polish' in all_text or 'radio' in all_text or 'modern' in all_text:
        variables["productionFX"] = 'Modern radio polish'
    elif 'vintage' in all_text or 'tape' in all_text:
        variables["productionFX"] = 'Vintage 2-inch tape saturation'
    
    # Extract mic type
    mics = ['neumann u87', 'sm58', 'sm57', 'akg', 'rode', 'shure']
    for mic in mics:
        if mic in all_text:
            variables["micType"] = mic.title()
            break
    
    return ExtractVariablesResponse(variables=variables)


@app.post("/api/suno", response_model=SunoResponse)
async def generate_suno_prompt(request: SunoRequest, authorization: Optional[str] = Header(None)):
    """
    Generate Suno music generation prompts using the "n00b-to-Pro" Translation Engine.
    Converts rambling, disorganized, or copyrighted ideas into precision engineering schemas.
    """
    if not request.user_input and len(request.conversation_context) == 0:
        raise HTTPException(status_code=400, detail="User input or conversation context required")
    
    # Extract auth token
    auth_token = None
    if authorization:
        parts = authorization.split(' ')
        if len(parts) > 1:
            auth_token = parts[1]
    
    # Get user context if available
    user_context = {}
    if request.userId:
        user_context = await get_user_context(request.userId, auth_token)
    
    # Build conversation history
    conversation_messages = request.conversation_context or []
    if request.user_input:
        conversation_messages.append({"role": "user", "content": request.user_input})
    
    # Build notes context - these are key variables/tags, separate from description
    notes_str = ""
    if request.notes and request.notes.strip():
        notes_str = f"\n\n--- KEY VARIABLES / TAGS (Separate from description above) ---\n{request.notes.strip()}\n--- END KEY VARIABLES / TAGS ---"
    
    # Build user context string
    user_context_str = ""
    if user_context:
        occupation = user_context.get("occupation", "")
        if occupation:
            user_context_str = f"\n\nUSER CONTEXT:\n- Occupation: {occupation}\n- Tools: {user_context.get('tools', '')}\n- Workflow: {user_context.get('workflow', '')}"
    
    try:
        # Fast mode: Minimal questions, quick generation
        # Detailed mode: More interactive, asks for more variables
        
        if request.mode == "fast":
            # Fast mode: Generate immediately with minimal questions
            analysis_prompt = f"""You are analyzing a request to generate a Suno music prompt.

CONVERSATION:
{chr(10).join([f"{msg.get('role', 'user')}: {msg.get('content', '')}" for msg in conversation_messages])}
{notes_str}
{user_context_str}

IMPORTANT: The KEY VARIABLES/TAGS section (if present) contains essential variables and tags that are SEPARATE from the conversation description. These must be incorporated into the final Suno prompt.

FAST MODE: Generate immediately with reasonable defaults. Only ask a question if CRITICAL information is missing (e.g., no genre, no topic/lyrics at all). Incorporate all variables from the KEY VARIABLES/TAGS section.

Respond with either:
- "READY_TO_GENERATE" if we can generate
- OR a single, critical question if absolutely essential info is missing"""
        else:
            # Detailed mode: More thorough analysis
            analysis_prompt = f"""You are analyzing a request to generate a Suno music prompt.

CONVERSATION:
{chr(10).join([f"{msg.get('role', 'user')}: {msg.get('content', '')}" for msg in conversation_messages])}
{notes_str}
{user_context_str}

IMPORTANT: The KEY VARIABLES/TAGS section (if present) contains essential variables and tags that are SEPARATE from the conversation description. These must be incorporated into the final Suno prompt.

DETAILED MODE: Ask questions to get the best possible result. Consider:
- Genre preferences (check both conversation and KEY VARIABLES/TAGS)
- Vocal style preferences (check both conversation and KEY VARIABLES/TAGS)
- Production style (lo-fi, polished, vintage, etc.) - check KEY VARIABLES/TAGS
- BPM/tempo preferences - check KEY VARIABLES/TAGS
- Key/mood preferences - check KEY VARIABLES/TAGS
- Any specific technical requirements - check KEY VARIABLES/TAGS

Ask ONE high-value question that will unlock the most important missing variable, or respond with "READY_TO_GENERATE" if we have enough info."""

        # Use Ollama for analysis
        async with httpx.AsyncClient(timeout=60.0) as client:
            if USE_UNIFIED_LLM:
                analysis_response = await client.post(
                    f"{LLM_API_BASE_URL}/chat/completions",
                    json={
                        "model": LLM_MODEL,
                        "messages": [
                            {"role": "system", "content": "You are an expert at analyzing music generation requests to determine if enough information exists."},
                            {"role": "user", "content": analysis_prompt}
                        ],
                        "temperature": 0.3,
                        "stream": False
                    },
                    headers={
                        "Authorization": f"Bearer {os.getenv('GEMINI_API_KEY', 'ollama-dummy-key')}"
                    } if os.getenv("GEMINI_API_KEY") else {}
                )
                if analysis_response.status_code == 200:
                    analysis_result = analysis_response.json()
                    analysis = analysis_result.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                else:
                    analysis = "READY_TO_GENERATE"
            else:
                analysis_response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/chat",
                    json={
                        "model": OLLAMA_MODEL,
                        "messages": [
                            {"role": "system", "content": "You are an expert at analyzing music generation requests to determine if enough information exists."},
                            {"role": "user", "content": analysis_prompt}
                        ],
                        "stream": False,
                        "options": {"temperature": 0.3, "num_predict": 100}
                    }
                )
                if analysis_response.status_code == 200:
                    analysis_result = analysis_response.json()
                    analysis = analysis_result.get("message", {}).get("content", "").strip()
                else:
                    analysis = "READY_TO_GENERATE"
        
        # Check if we need clarification
        if "READY_TO_GENERATE" not in analysis.upper():
            return SunoResponse(
                style_box="",
                lyrics_box="",
                needs_clarification=True,
                question=analysis
            )
        
        # Generate Suno prompt
        suno_prompt = f"""You are a "n00b-to-Pro" Translation Engine for Suno music generation. Your sole mission is to act as a high-fidelity bridge from "English to AI to Real Music."

RULES:
1. NO CONVERSATIONAL FILLER. Output only the two copy-pasteable blocks.
2. NEVER use artist names. Deconstruct them into mechanical DNA (e.g., "Asking Alexandria" -> "Modern Metalcore, Trance-gate synths, Aggressive rhythmic breakdowns, Dual-vocal layering, high-gain frequency response").
3. Use technical variable stacking: "Sidechain compression," "Gated reverb," "Tube saturation," "Brickwall limiting," "Stereo width," "Analog circuitry."
4. Use [Vocal Style: ] tags: "Vocal fry," "Belting," "Whisper-track," or "Glottal stops."
5. Use [Production: ] tags: "Lo-fi grit," "Modern radio polish," or "Vintage 2-inch tape saturation."
6. Use CAPITALIZED words in lyrics to trigger increased volume and intensity.

CONVERSATION:
{chr(10).join([f"{msg.get('role', 'user')}: {msg.get('content', '')}" for msg in conversation_messages])}
{notes_str}
{user_context_str}

IMPORTANT: The KEY VARIABLES/TAGS section (if present) contains essential variables and tags that are SEPARATE from the conversation description. Incorporate ALL variables from this section into the generated Suno prompt.

Generate:
1. STYLE BOX: A 200-character CSV string optimized with Genre, Sub-genre, BPM, Key, Era, Mic-type, and Production FX
2. LYRICS BOX: Formatted lyrics with sections:
   - [Intro | Instrumentation: ]
   - [Verse 1 | Vocal Style: | Production: ]
   - [Pre-Chorus | Energy: | Transition: ]
   - [Chorus | Arrangement: | Dynamics: ] (use CAPS for emphasis)
   - [Verse 2 | Variation: ]
   - [Bridge | Shift: | Effects: ]
   - [Outro | Fade Style: ]
   - [End]

If user provided specific lyrics, incorporate them exactly while optimizing structure for rhythmic flow.
If user provided only a topic, write high-impact lyrics.

Output format:
STYLE BOX:
[your CSV string here]

LYRICS BOX:
[your formatted lyrics here]"""

        # Generate using Ollama or Gemini
        async with httpx.AsyncClient(timeout=120.0) as client:
            if USE_UNIFIED_LLM and os.getenv("GEMINI_API_KEY"):
                gen_response = await client.post(
                    f"{LLM_API_BASE_URL}/chat/completions",
                    json={
                        "model": LLM_MODEL,
                        "messages": [
                            {"role": "system", "content": "You are a Suno music generation expert creating precision engineering schemas."},
                            {"role": "user", "content": suno_prompt}
                        ],
                        "temperature": 0.7,
                        "stream": False
                    },
                    headers={
                        "Authorization": f"Bearer {os.getenv('GEMINI_API_KEY')}"
                    }
                )
                if gen_response.status_code == 200:
                    gen_result = gen_response.json()
                    generated = gen_result.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                else:
                    raise HTTPException(status_code=500, detail="Failed to generate Suno prompt")
            else:
                gen_response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/chat",
                    json={
                        "model": OLLAMA_MODEL,
                        "messages": [
                            {"role": "system", "content": "You are a Suno music generation expert creating precision engineering schemas."},
                            {"role": "user", "content": suno_prompt}
                        ],
                        "stream": False,
                        "options": {"temperature": 0.7, "num_predict": 800}
                    }
                )
                if gen_response.status_code == 200:
                    gen_result = gen_response.json()
                    generated = gen_result.get("message", {}).get("content", "").strip()
                else:
                    raise HTTPException(status_code=500, detail="Failed to generate Suno prompt")
        
        # Parse the output to extract STYLE BOX and LYRICS BOX
        style_box = ""
        lyrics_box = ""
        
        # Try to extract STYLE BOX
        style_match = None
        if "STYLE BOX:" in generated:
            style_start = generated.find("STYLE BOX:") + len("STYLE BOX:")
            style_end = generated.find("LYRICS BOX:", style_start)
            if style_end == -1:
                style_end = len(generated)
            style_box = generated[style_start:style_end].strip()
        elif "STYLE BOX" in generated:
            style_start = generated.find("STYLE BOX") + len("STYLE BOX")
            style_end = generated.find("LYRICS BOX", style_start)
            if style_end == -1:
                style_end = len(generated)
            style_box = generated[style_start:style_end].strip()
            # Clean up common prefixes
            style_box = style_box.lstrip(":").strip()
        
        # Try to extract LYRICS BOX
        lyrics_match = None
        if "LYRICS BOX:" in generated:
            lyrics_start = generated.find("LYRICS BOX:") + len("LYRICS BOX:")
            lyrics_box = generated[lyrics_start:].strip()
        elif "LYRICS BOX" in generated:
            lyrics_start = generated.find("LYRICS BOX") + len("LYRICS BOX")
            lyrics_box = generated[lyrics_start:].strip()
            lyrics_box = lyrics_box.lstrip(":").strip()
        
        # Fallback: if parsing failed, try to split by common patterns
        if not style_box or not lyrics_box:
            # Try splitting by double newline or other patterns
            parts = generated.split("\n\n", 1)
            if len(parts) >= 2:
                style_box = parts[0].strip()
                lyrics_box = parts[1].strip()
            else:
                # Last resort: use the whole thing as lyrics, generate a basic style
                lyrics_box = generated.strip()
                style_box = "Pop,Modern,120 BPM,C Major,2020s,Neumann U87,Modern radio polish"
        
        # Extract variables for detailed mode
        extracted_vars = None
        if request.mode == "detailed":
            all_text = " ".join([msg.get("content", "") for msg in conversation_messages]).lower()
            import re
            extracted_vars = {
                "genre": "",
                "subGenre": "",
                "bpm": "",
                "key": "",
                "era": "",
                "micType": "",
                "productionFX": "",
                "vocalStyle": "",
                "instrumentation": "",
                "energy": "",
                "arrangement": "",
                "dynamics": ""
            }
            
            # Extract genre
            genres = ['pop', 'rock', 'hip hop', 'rap', 'country', 'jazz', 'blues', 'electronic', 'edm', 'metal', 'punk', 'indie', 'folk', 'r&b', 'reggae', 'classical', 'k-pop', 'j-pop', 'synth-pop', 'metalcore', 'post-hardcore']
            for genre in genres:
                if genre in all_text:
                    extracted_vars["genre"] = genre.title()
                    break
            
            # Extract BPM
            bpm_patterns = [
                r'\b(\d{2,3})\s*(?:bpm|beats?\s*per\s*minute)\b',
                r'\b(\d{2,3})\s*(?:tempo|speed)\b',
                r'tempo[:\s]+(\d{2,3})'
            ]
            for pattern in bpm_patterns:
                match = re.search(pattern, all_text, re.IGNORECASE)
                if match:
                    extracted_vars["bpm"] = match.group(1)
                    break
            
            # Extract key
            keys = ['c major', 'd major', 'e major', 'f major', 'g major', 'a major', 'b major',
                    'c minor', 'd minor', 'e minor', 'f minor', 'g minor', 'a minor', 'b minor',
                    'c#', 'd#', 'f#', 'g#', 'a#', 'cm', 'dm', 'em', 'fm', 'gm', 'am', 'bm']
            for key in keys:
                if key in all_text:
                    extracted_vars["key"] = key.upper()
                    break
            
            # Extract era
            eras = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s', 'vintage', 'modern', 'retro', 'classic']
            for era in eras:
                if era in all_text:
                    extracted_vars["era"] = era
                    break
            
            # Extract vocal style
            vocal_styles = {
                'belting': 'Belting',
                'whisper': 'Whisper-track',
                'fry': 'Vocal fry',
                'falsetto': 'Falsetto',
                'screaming': 'Screaming',
                'rapping': 'Rapping',
                'harmony': 'Harmony',
                'glottal': 'Glottal stops'
            }
            for style_key, style_value in vocal_styles.items():
                if style_key in all_text:
                    extracted_vars["vocalStyle"] = style_value
                    break
            
            # Extract production style
            if 'lo-fi' in all_text or 'lofi' in all_text:
                extracted_vars["productionFX"] = 'Lo-fi grit'
            elif 'polish' in all_text or 'radio' in all_text or 'modern' in all_text:
                extracted_vars["productionFX"] = 'Modern radio polish'
            elif 'vintage' in all_text or 'tape' in all_text:
                extracted_vars["productionFX"] = 'Vintage 2-inch tape saturation'
        
        return SunoResponse(
            style_box=style_box,
            lyrics_box=lyrics_box,
            needs_clarification=False,
            question=None,
            extracted_variables=extracted_vars
        )
        
    except Exception as e:
        logger.error(f"Error generating Suno prompt: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate Suno prompt: {str(e)}")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Prompt Writer",
        "description": "AI prompt optimization service with user interaction",
        "version": "1.0.0",
        "endpoints": {
            "rewrite": "/api/rewrite",
            "rewrite_with_clarification": "/api/rewrite-with-clarification",
            "ask_user": "/api/ask-user",
            "generate": "/api/generate",
            "suno": "/api/suno",
            "health": "/health"
        }
    }

