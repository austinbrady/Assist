"""
Chaos-to-Clarity AI Prompt Engineer

Transforms disorganized user input into optimized, structured prompts
ready for AI code generation agents using Ollama for intelligent enhancement.
"""

import re
import json
import subprocess
import urllib.request
import urllib.parse
import os
from typing import List, Dict, Optional, Tuple, Literal
from dataclasses import dataclass


@dataclass
class AnalysisResult:
    """Results from analyzing user input"""
    core_intent: str
    desired_outcome: str
    mentioned_features: List[str]
    mentioned_constraints: List[str]
    ambiguity_level: str  # "low", "medium", "high"
    missing_info: List[str]
    contradictions: List[str]


@dataclass
class ClarifyingQuestion:
    """A clarifying question to ask the user"""
    question: str
    category: str  # "technology", "features", "design", "constraints"


class ChaosToClarityEngine:
    """Main engine for transforming chaotic input into clear prompts"""
    
    # Technology keywords for detection
    TECH_KEYWORDS = {
        "web": ["website", "web app", "webapp", "web application", "site", "html", "css", "javascript", "react", "vue", "angular", "next.js", "django", "flask", "express", "node"],
        "mobile": ["mobile app", "ios", "android", "react native", "flutter", "swift", "kotlin"],
        "desktop": ["desktop app", "electron", "qt", "tkinter", "gui"],
        "backend": ["api", "server", "backend", "database", "postgresql", "mongodb", "sqlite", "mysql"],
        "data": ["data science", "machine learning", "ml", "ai", "python", "pandas", "numpy", "jupyter"],
        "script": ["script", "automation", "tool", "utility"]
    }
    
    # Ambiguity indicators
    VAGUE_TERMS = ["something", "good", "nice", "better", "improve", "make it work", "fix it", "a website", "an app", "a database"]
    
    def __init__(self, use_ollama: bool = True, ollama_model: str = "llama3.2", 
                 gemini_api_key: Optional[str] = None):
        self.user_input = ""
        self.clarifications = {}
        self.analysis = None
        self.use_ollama = use_ollama
        self.ollama_model = ollama_model
        self.gemini_api_key = gemini_api_key or os.getenv('GEMINI_API_KEY')
        self._last_ollama_error = None
        self._last_gemini_error = None
    
    def analyze_input(self, user_input: str) -> AnalysisResult:
        """
        Step 1: Analyze and refine the user's input
        """
        self.user_input = user_input.lower()
        
        # Extract core intent
        core_intent = self._extract_core_intent(user_input)
        
        # Extract desired outcome
        desired_outcome = self._extract_desired_outcome(user_input)
        
        # Extract mentioned features
        mentioned_features = self._extract_features(user_input)
        
        # Extract mentioned constraints
        mentioned_constraints = self._extract_constraints(user_input)
        
        # Determine ambiguity
        ambiguity_level, missing_info, contradictions = self._assess_ambiguity(
            user_input, core_intent, desired_outcome, mentioned_features
        )
        
        self.analysis = AnalysisResult(
            core_intent=core_intent,
            desired_outcome=desired_outcome,
            mentioned_features=mentioned_features,
            mentioned_constraints=mentioned_constraints,
            ambiguity_level=ambiguity_level,
            missing_info=missing_info,
            contradictions=contradictions
        )
        
        return self.analysis
    
    def _extract_core_intent(self, text: str) -> str:
        """Extract the main goal from the input"""
        # Look for action verbs and goals
        intent_patterns = [
            r"(?:build|create|make|develop|write|design|generate|build)\s+(?:a|an|the)?\s*([^.!?]+)",
            r"(?:i\s+want|i\s+need|i\s+would\s+like)\s+(?:to\s+)?([^.!?]+)",
            r"(?:goal|objective|purpose|aim)\s+is\s+to\s+([^.!?]+)",
        ]
        
        for pattern in intent_patterns:
            match = re.search(pattern, text.lower())
            if match:
                return match.group(1).strip()
        
        # Fallback: return first sentence or first 50 chars
        sentences = text.split('.')
        return sentences[0].strip() if sentences else text[:50].strip()
    
    def _extract_desired_outcome(self, text: str) -> str:
        """Extract what the user wants to achieve"""
        outcome_keywords = ["website", "app", "application", "script", "tool", "system", "database", "api", "component", "function"]
        
        text_lower = text.lower()
        for keyword in outcome_keywords:
            if keyword in text_lower:
                # Extract the sentence containing the keyword
                sentences = text.split('.')
                for sentence in sentences:
                    if keyword in sentence.lower():
                        return sentence.strip()
                # If not found in sentences, extract broader context
                idx = text_lower.find(keyword)
                start = max(0, idx - 50)
                end = min(len(text), idx + len(keyword) + 100)
                return text[start:end].strip()
        
        # Fallback: use first sentence or first 100 chars
        sentences = text.split('.')
        if sentences:
            return sentences[0].strip()
        return text[:100].strip()
    
    def _extract_features(self, text: str) -> List[str]:
        """Extract mentioned features or requirements"""
        features = []
        
        # Skip if this looks like clarifications text
        if "clarifications:" in text.lower() or "technology:" in text.lower() or "features:" in text.lower():
            return features
        
        # Look for bullet points or lists first (most structured)
        lines = text.split('\n')
        for line in lines:
            line_stripped = line.strip()
            line_lower = line_stripped.lower()
            # Skip clarification lines
            if "technology:" in line_lower or "features:" in line_lower or "design:" in line_lower:
                continue
            # Match bullet points: - item, * item, + item, or numbered: 1. item
            if re.match(r'^[\-\*\+]\s+', line_stripped) or re.match(r'^\d+\.\s+', line_stripped):
                # Remove the bullet/number prefix
                feature = re.sub(r'^[\-\*\+\d\.\s]+', '', line_stripped)
                if feature and len(feature) > 3:
                    features.append(feature)
        
        # Look for feature indicators in sentences
        feature_patterns = [
            r"(?:should|must|needs?|requires?|with|including|features?)\s+([^.!?\n]+)",
            r"(?:add|include|implement)\s+([^.!?\n]+)",
        ]
        
        for pattern in feature_patterns:
            matches = re.findall(pattern, text.lower())
            for match in matches:
                match_clean = match.strip()
                # Avoid duplicates, very short matches, and clarification fragments
                if (match_clean and len(match_clean) > 5 and 
                    match_clean not in [f.lower() for f in features] and
                    "clarification" not in match_clean.lower() and
                    "technology:" not in match_clean.lower()):
                    features.append(match_clean)
        
        return features
    
    def _extract_constraints(self, text: str) -> List[str]:
        """Extract mentioned constraints or limitations"""
        constraints = []
        
        # Skip if this looks like clarifications text (to avoid fragments)
        if "clarifications:" in text.lower() or "technology:" in text.lower() or "features:" in text.lower():
            return constraints
        
        constraint_keywords = ["avoid", "don't", "not", "without", "exclude", "limit", "constraint", "restriction", "except"]
        text_lower = text.lower()
        
        # Look for complete sentences with constraint keywords
        sentences = re.split(r'[.!?]\s+', text)
        for sentence in sentences:
            sentence_lower = sentence.lower()
            for keyword in constraint_keywords:
                if keyword in sentence_lower:
                    # Only add if it's a meaningful sentence (not a fragment)
                    sentence_clean = sentence.strip()
                    if len(sentence_clean) > 10 and len(sentence_clean) < 200:
                        # Check it's not just a fragment (starts with lowercase or is mid-word)
                        if sentence_clean[0].isupper() or sentence_clean[0].islower():
                            constraints.append(sentence_clean)
                            break
        
        # Remove duplicates
        return list(dict.fromkeys(constraints))  # Preserves order while removing duplicates
    
    def _assess_ambiguity(self, text: str, core_intent: str, desired_outcome: str, features: List[str]) -> Tuple[str, List[str], List[str]]:
        """Assess the level of ambiguity in the input"""
        missing_info = []
        contradictions = []
        ambiguity_score = 0
        
        text_lower = text.lower()
        
        # Check for vague terms
        vague_count = sum(1 for term in self.VAGUE_TERMS if term in text_lower)
        if vague_count > 2:
            ambiguity_score += 3
            missing_info.append("Specific technical requirements")
        
        # Check technology stack ambiguity
        tech_detected = []
        for category, keywords in self.TECH_KEYWORDS.items():
            if any(kw in text_lower for kw in keywords):
                tech_detected.append(category)
        
        if not tech_detected:
            ambiguity_score += 2
            missing_info.append("Technology stack not specified")
        elif len(tech_detected) > 2:
            ambiguity_score += 1
            missing_info.append("Multiple technology categories mentioned - needs clarification")
        
        # Check for missing critical info
        if "website" in text_lower or "web app" in text_lower:
            if "framework" not in text_lower and "react" not in text_lower and "vue" not in text_lower and "html" not in text_lower:
                ambiguity_score += 2
                missing_info.append("Web framework/technology not specified")
        
        if "database" in text_lower:
            if not any(db in text_lower for db in ["postgresql", "mongodb", "sqlite", "mysql", "database type"]):
                ambiguity_score += 2
                missing_info.append("Database type not specified")
        
        if "app" in text_lower and "mobile" not in text_lower and "web" not in text_lower and "desktop" not in text_lower:
            ambiguity_score += 2
            missing_info.append("App platform not specified (web/mobile/desktop)")
        
        # Check for contradictions (basic check)
        if "simple" in text_lower and ("complex" in text_lower or "advanced" in text_lower):
            contradictions.append("Conflicting complexity requirements")
            ambiguity_score += 1
        
        # Determine ambiguity level
        if ambiguity_score >= 5:
            ambiguity_level = "high"
        elif ambiguity_score >= 2:
            ambiguity_level = "medium"
        else:
            ambiguity_level = "low"
        
        return ambiguity_level, missing_info, contradictions
    
    def generate_clarifying_questions(self, analysis: AnalysisResult) -> List[ClarifyingQuestion]:
        """
        Step 2: Generate up to 3 clarifying questions if ambiguity is high
        """
        questions = []
        
        if analysis.ambiguity_level == "low":
            return questions
        
        # Priority 1: Technology stack
        tech_detected = []
        for category, keywords in self.TECH_KEYWORDS.items():
            if any(kw in self.user_input for kw in keywords):
                tech_detected.append(category)
        
        if not tech_detected or len(tech_detected) > 2:
            # Simplified, product-focused question
            questions.append(ClarifyingQuestion(
                question="What kind of product is this? (e.g., a standard **website**, an **iPhone/Android app**, or an **automation script/tool**?)",
                category="technology"
            ))
        
        # Priority 2: Key features/functionality
        if len(analysis.mentioned_features) == 0 or any(term in str(analysis.mentioned_features).lower() for term in self.VAGUE_TERMS):
            questions.append(ClarifyingQuestion(
                question="What is the single most critical function or feature the user must be able to perform in this application?",
                category="features"
            ))
        
        # Priority 3: Design/Interface
        if "look" in self.user_input or "design" in self.user_input or "ui" in self.user_input or "interface" in self.user_input:
            if "color" not in self.user_input and "style" not in self.user_input and "theme" not in self.user_input:
                questions.append(ClarifyingQuestion(
                    question="Is there a specific visual style, color scheme, or existing site/application you want it to emulate?",
                    category="design"
                ))
        
        # Limit to 3 questions (before adding output format question)
        return questions[:3]
    
    def _map_simple_tech(self, simple_answer: str) -> str:
        """Map simple user-friendly answers to full technology stack descriptions"""
        answer_lower = simple_answer.lower()
        
        # Map simple product types to full tech stacks
        if "website" in answer_lower or "web" in answer_lower or "site" in answer_lower:
            return "Web Application (React/Next.js frontend, Node/Express or Python/Django backend)"
        elif "iphone" in answer_lower or "ios" in answer_lower:
            return "Mobile App (iOS/Swift or React Native)"
        elif "android" in answer_lower:
            return "Mobile App (Android/Kotlin or React Native)"
        elif "app" in answer_lower and ("mobile" in answer_lower or "phone" in answer_lower):
            return "Mobile App (React Native - cross-platform)"
        elif "script" in answer_lower or "tool" in answer_lower or "automation" in answer_lower:
            return "Automation Script/Tool (Python or Node.js)"
        elif "desktop" in answer_lower:
            return "Desktop Application (Electron or native framework)"
        else:
            # Return as-is if it's already technical
            return simple_answer
    
    def _detect_technology(self, text: str) -> Optional[str]:
        """Detect technology stack from text"""
        text_lower = text.lower()
        
        # Check for specific technologies (order matters - check specific before general)
        tech_mapping = {
            "iphone": "Mobile App (iOS/Swift or React Native)",  # Enhanced mapping
            "ios": "Mobile App (iOS/Swift)",
            "android": "Mobile App (Android/Kotlin or React Native)",  # Added for completeness
            "react native": "Mobile App (React Native)",  # Strong preference for cross-platform
            "react": "React (Frontend)",
            "vue": "Vue.js (Frontend)",
            "angular": "Angular (Frontend)",
            "next.js": "Next.js (Full-stack Web)",
            "django": "Django (Python Backend)",
            "flask": "Flask (Python Backend)",
            "express": "Express.js (Node Backend)",
            "python": "Python (Script/Backend)",
            "javascript": "JavaScript (Web/Script)",
            "typescript": "TypeScript (Web/Script)",
            "html": "HTML/CSS/JavaScript",
            "website": "Web Application (React/Node or simple HTML)",  # Enhanced mapping
            "web app": "Web Application (React/Node or simple HTML)",
            "macos": "macOS",
        }
        
        for keyword, tech_name in tech_mapping.items():
            if keyword in text_lower:
                return tech_name
        
        # Check for categories with enhanced mappings
        if "web" in text_lower or "website" in text_lower:
            return "Web Application (React/Node or simple HTML)"
        elif "mobile" in text_lower or ("app" in text_lower and "web" not in text_lower and "desktop" not in text_lower):
            return "Mobile App (React Native - cross-platform)"
        elif "script" in text_lower or "tool" in text_lower or "automation" in text_lower:
            return "Automation Script/Tool (Python or Node.js)"
        
        return None
    
    def _build_goal(self, user_input: str, analysis: AnalysisResult, clarifications: Optional[Dict[str, str]]) -> str:
        """Build a clear, complete goal statement"""
        # Start with the original input's first meaningful sentence
        sentences = [s.strip() for s in re.split(r'[.!?]\n?', user_input) if s.strip()]
        
        goal = None
        if sentences:
            # Use the first sentence that's substantial
            for sentence in sentences:
                if len(sentence) > 15 and not sentence.lower().startswith(('clarification', 'technology', 'feature')):
                    goal = sentence
                    break
        
        # Fallback to analysis
        if not goal:
            goal = analysis.core_intent or analysis.desired_outcome
            if not goal or len(goal) < 10:
                goal = user_input.split('.')[0].strip() if '.' in user_input else user_input[:100].strip()
        
        # Clean up goal
        goal = goal.strip()
        if not goal[0].isupper():
            goal = goal[0].upper() + goal[1:]
        
        # Enhance with technology if provided - but make it natural
        if clarifications and "technology" in clarifications:
            tech = clarifications['technology'].strip()
            # Map simple answers to full tech stack, but use a shorter version for goal
            tech_mapped = self._map_simple_tech(tech)
            # Extract a shorter version for the goal (just the product type)
            if "website" in tech.lower() or "web" in tech.lower():
                tech_short = "web"
            elif "iphone" in tech.lower() or "ios" in tech.lower():
                tech_short = "iOS"
            elif "android" in tech.lower():
                tech_short = "Android"
            elif "script" in tech.lower() or "tool" in tech.lower():
                tech_short = "automation tool"
            else:
                tech_short = tech
            
            tech_lower = tech_short.lower()
            # Don't add if already mentioned
            if tech_lower not in goal.lower():
                # Make it natural - "for iOS" or "using web" depending on context
                if "app" in goal.lower() or "application" in goal.lower():
                    goal = f"{goal} for {tech_short}"
                else:
                    goal = f"{goal} using {tech_short}"
        
        # Ensure it ends properly
        if not goal.endswith('.') and len(goal) < 150:
            goal += '.'
        
        return goal
    
    def _build_context(self, user_input: str, analysis: AnalysisResult) -> str:
        """Build context paragraph from original input"""
        # Use the first complete sentence from original input
        sentences = [s.strip() for s in re.split(r'[.!?]\n?', user_input) if s.strip()]
        
        if sentences and len(sentences[0]) > 20:
            context = sentences[0]
            # Ensure proper capitalization
            if not context[0].isupper():
                context = context[0].upper() + context[1:]
            if not context.endswith('.'):
                context += '.'
            return context
        
        # Fallback: build from analysis
        core_intent = analysis.core_intent.strip()
        if core_intent:
            if not core_intent[0].isupper():
                core_intent = core_intent[0].upper() + core_intent[1:]
            return f"The user wants to {core_intent}."
        
        # Last resort
        return user_input[:150].strip() + ('.' if not user_input.endswith('.') else '')
    
    def _call_ollama(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Call Ollama HTTP API for intelligent text processing"""
        if not self.use_ollama:
            return ""
        
        try:
            # Build the request payload
            payload = {
                "model": self.ollama_model,
                "prompt": prompt,
                "stream": False
            }
            if system_prompt:
                payload["system"] = system_prompt
            
            # Convert to JSON
            data = json.dumps(payload).encode('utf-8')
            
            # Make HTTP request to Ollama API (default port 11434)
            req = urllib.request.Request(
                'http://localhost:11434/api/generate',
                data=data,
                headers={'Content-Type': 'application/json'}
            )
            
            # Use longer timeout for code generation
            system_prompt_text = system_prompt or ""
            timeout = 120 if "Generate the actual code" in system_prompt_text else 60
            
            with urllib.request.urlopen(req, timeout=timeout) as response:
                result = json.loads(response.read().decode('utf-8'))
                if 'response' in result:
                    response_text = result['response'].strip()
                    
                    # For code generation, preserve code blocks
                    is_code = "Generate the actual code" in system_prompt_text
                    
                    if is_code:
                        # If response doesn't have code blocks, it might be wrapped in markdown
                        if '```' not in response_text:
                            # Check if it looks like code (has common code patterns)
                            code_indicators = ['def ', 'function ', 'class ', 'import ', 'const ', 'let ', 'var ', 'public ', 'private ']
                            if any(indicator in response_text for indicator in code_indicators):
                                # It's code without markdown, return as is
                                return response_text
                        # If it has code blocks, extract the code
                        if response_text.startswith('```'):
                            lines = response_text.split('\n')
                            # Find the closing ```
                            code_lines = []
                            in_code = False
                            for line in lines:
                                if line.strip().startswith('```'):
                                    if in_code:
                                        break  # Found closing ```
                                    in_code = True
                                    # Skip the language identifier if present
                                    if len(line.strip()) > 3:
                                        continue
                                elif in_code:
                                    code_lines.append(line)
                            if code_lines:
                                response_text = '\n'.join(code_lines).strip()
                    else:
                        # For non-code, remove markdown code blocks if present
                        if response_text.startswith('```'):
                            lines = response_text.split('\n')
                            if len(lines) > 2:
                                response_text = '\n'.join(lines[1:-1]).strip()
                    
                    # Remove quotes if wrapped (but not for code)
                    if not is_code:
                        if response_text.startswith('"') and response_text.endswith('"'):
                            response_text = response_text[1:-1]
                        elif response_text.startswith("'") and response_text.endswith("'"):
                            response_text = response_text[1:-1]
                    
                    # For single-line non-code responses, take first sentence if very long
                    if not is_code and '\n' not in response_text and len(response_text) > 500:
                        sentences = re.split(r'[.!?]\s+', response_text)
                        if sentences:
                            response_text = sentences[0] + '.'
                    
                    return response_text
        except urllib.error.URLError as e:
            # Connection error - Ollama might not be running
            if hasattr(e, 'reason'):
                # Store error for debugging (but don't print to avoid cluttering)
                self._last_ollama_error = f"Connection error: {e.reason}"
            return ""
        except urllib.error.HTTPError as e:
            # HTTP error
            self._last_ollama_error = f"HTTP error: {e.code} - {e.reason}"
            return ""
        except (json.JSONDecodeError, TimeoutError, OSError) as e:
            # Other errors
            self._last_ollama_error = f"Error: {type(e).__name__}"
            return ""
        except Exception as e:
            # Any other unexpected error
            self._last_ollama_error = f"Unexpected error: {type(e).__name__}"
            return ""
        
        return ""
    
    def _call_gemini(self, prompt: str, system_prompt: Optional[str] = None, model: str = "gemini-1.5-flash") -> str:
        """Call Google Gemini API for intelligent text processing"""
        if not self.gemini_api_key:
            return ""
        
        try:
            import urllib.request
            import urllib.parse
            
            # Build the request payload for Gemini API
            contents = [{"parts": [{"text": prompt}]}]
            
            payload = {
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 2048,
                }
            }
            
            # Add system instruction if provided
            if system_prompt:
                payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}
            
            # Convert to JSON
            data = json.dumps(payload).encode('utf-8')
            
            # Make HTTP request to Gemini API
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.gemini_api_key}"
            req = urllib.request.Request(
                url,
                data=data,
                headers={'Content-Type': 'application/json'}
            )
            
            timeout = 120 if "Generate the actual code" in (system_prompt or "") else 60
            
            with urllib.request.urlopen(req, timeout=timeout) as response:
                result = json.loads(response.read().decode('utf-8'))
                
                if 'candidates' in result and len(result['candidates']) > 0:
                    candidate = result['candidates'][0]
                    if 'content' in candidate and 'parts' in candidate['content']:
                        response_text = candidate['content']['parts'][0].get('text', '').strip()
                        
                        # Clean up response similar to Ollama
                        is_code = "Generate the actual code" in (system_prompt or "")
                        
                        if is_code:
                            # Preserve code blocks
                            if '```' not in response_text:
                                code_indicators = ['def ', 'function ', 'class ', 'import ', 'const ', 'let ', 'var ', 'public ', 'private ']
                                if any(indicator in response_text for indicator in code_indicators):
                                    return response_text
                            # Extract code from markdown blocks
                            if response_text.startswith('```'):
                                lines = response_text.split('\n')
                                code_lines = []
                                in_code = False
                                for line in lines:
                                    if line.strip().startswith('```'):
                                        if in_code:
                                            break
                                        in_code = True
                                        if len(line.strip()) > 3:
                                            continue
                                    elif in_code:
                                        code_lines.append(line)
                                if code_lines:
                                    response_text = '\n'.join(code_lines).strip()
                        else:
                            # Remove markdown code blocks for non-code
                            if response_text.startswith('```'):
                                lines = response_text.split('\n')
                                if len(lines) > 2:
                                    response_text = '\n'.join(lines[1:-1]).strip()
                            
                            # Remove quotes
                            if response_text.startswith('"') and response_text.endswith('"'):
                                response_text = response_text[1:-1]
                            elif response_text.startswith("'") and response_text.endswith("'"):
                                response_text = response_text[1:-1]
                        
                        return response_text
                        
        except urllib.error.HTTPError as e:
            # Handle rate limits and API errors
            if e.code == 429:
                self._last_gemini_error = "Rate limit exceeded"
            elif e.code >= 500:
                self._last_gemini_error = f"Server error: {e.code}"
            else:
                self._last_gemini_error = f"HTTP error: {e.code} - {e.reason}"
            return ""
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as e:
            self._last_gemini_error = f"Error: {type(e).__name__}"
            return ""
        except Exception as e:
            self._last_gemini_error = f"Unexpected error: {type(e).__name__}"
            return ""
        
        return ""
    
    def _call_model(self, prompt: str, system_prompt: Optional[str] = None, 
                    task_type: Literal["simple", "complex"] = "simple",
                    primary: Literal["ollama", "gemini"] = "auto") -> str:
        """
        Unified model calling interface with automatic fallback.
        
        Args:
            prompt: The user prompt
            system_prompt: System instructions
            task_type: "simple" for classification/light tasks, "complex" for rewriting/heavy tasks
            primary: "auto" (default), "ollama", or "gemini" to force primary model
        
        Returns:
            Model response or empty string if both fail
        """
        # Determine primary model based on task type
        if primary == "auto":
            if task_type == "simple":
                primary = "ollama"  # Ollama for simple tasks
            else:
                primary = "gemini"  # Gemini for complex tasks
        
        # Try primary model first
        if primary == "ollama":
            result = self._call_ollama(prompt, system_prompt)
            if result:
                return result
            # Fallback to Gemini
            if self.gemini_api_key:
                result = self._call_gemini(prompt, system_prompt)
                if result:
                    return result
        else:  # primary == "gemini"
            if self.gemini_api_key:
                result = self._call_gemini(prompt, system_prompt)
                if result:
                    return result
            # Fallback to Ollama
            result = self._call_ollama(prompt, system_prompt)
            if result:
                return result
        
        return ""
    
    def _classify_intent(self, user_input: str) -> str:
        """Classify user intent into: 'code', 'creative', 'document', or 'general'"""
        user_lower = user_input.lower()
        
        # PRIORITY 1: Check for product/platform indicators FIRST
        # If user mentions building a product (app, website, etc.), it's a code request
        # even if the product has creative features (e.g., "app that generates songs")
        product_indicators = [
            "app", "application", "website", "web app", "webapp", "script", "tool", 
            "program", "function", "class", "component", "database", "api", "service",
            "module", "backend", "frontend", "platform", "system"
        ]
        if any(indicator in user_lower for indicator in product_indicators):
            return "code"
        
        # PRIORITY 2: Check for implementation verbs with product context
        implementation_verbs = ["build", "create", "develop", "make", "implement", "write"]
        for verb in implementation_verbs:
            if f"{verb} a" in user_lower or f"{verb} an" in user_lower:
                # If followed by product terms, it's code
                if any(term in user_lower for term in ["app", "application", "website", "script", "tool", "program"]):
                    return "code"
        
        # PRIORITY 3: Check for creative/content keywords (only if no product mentioned)
        creative_keywords = [
            "song", "music", "tune", "lyric", "melody", "beat", "track",
            "image", "picture", "photo", "art", "drawing", "painting", "illustration",
            "story", "poem", "creative", "artistic", "design", "visual"
        ]
        if any(kw in user_lower for kw in creative_keywords):
            return "creative"
        
        # PRIORITY 4: Check for document/text analysis keywords
        document_keywords = [
            "summary", "summarize", "abstract", "report", "analysis", "analyze",
            "document", "text", "article", "paper", "essay", "extract", "key points"
        ]
        if any(kw in user_lower for kw in document_keywords):
            return "document"
        
        # Default to general
        return "general"
    
    def _detect_code_request(self, user_input: str) -> bool:
        """Detect if the user explicitly wants code generated (prioritizes product/platform terms)"""
        user_lower = user_input.lower()
        
        # PRIORITY 1: High-Priority Product/Platform Indicators (Code/App Intent)
        # If a product is named, it is a code request, even if the feature is creative.
        # E.g., "I want an app that generates songs" is a code request for an app builder.
        product_indicators = [
            "app", "application", "website", "web app", "webapp", "script", "tool", 
            "function", "class", "component", "database", "api", "service", "module",
            "program", "platform", "system"
        ]
        if any(indicator in user_lower for indicator in product_indicators):
            # If a product is mentioned, it's a code request regardless of creative features
            return True
        
        # PRIORITY 2: General Code/Implementation Indicators
        code_indicators = [
            "write code", "generate code", "create code", "show me code",
            "code for", "implement this", "build this", "make this",
            "write a script", "create a script", "generate a script",
            "code example", "example code", "sample code",
            "code to", "how to code", "how do I"
        ]
        
        if any(indicator in user_lower for indicator in code_indicators):
            return True
        
        # PRIORITY 3: Implementation Verb Check (refined)
        implementation_verbs = ["build", "create", "make", "develop", "write", "implement"]
        for verb in implementation_verbs:
            if f"{verb} a" in user_lower or f"{verb} an" in user_lower:
                # Check if followed by technical/product terms
                tech_terms = ["component", "app", "application", "script", "function", "class", "module", "service", "website", "site", "tool"]
                if any(term in user_lower for term in tech_terms):
                    return True
        
        # Check intent classification as fallback
        intent = self._classify_intent(user_input)
        if intent == "code":
            return True
        
        return False
    
    def _generate_code_with_ollama(self, user_input: str, clarifications: Optional[Dict[str, str]] = None, analysis: Optional[AnalysisResult] = None) -> str:
        """Use Ollama to generate actual code based on the user's request"""
        if not self.use_ollama:
            return ""
        
        # Build comprehensive context for code generation using our analysis
        context_parts = [f"Goal: {user_input}"]
        
        # Add technology stack
        tech_stack = None
        if clarifications and "technology" in clarifications:
            tech_stack = clarifications['technology']
            # Map simple answers to full tech stack
            tech_stack = self._map_simple_tech(tech_stack)
            context_parts.append(f"\nTechnology Stack: {tech_stack}")
        elif analysis:
            # Try to detect from analysis
            detected_tech = self._detect_technology(user_input)
            if detected_tech:
                tech_stack = detected_tech
                context_parts.append(f"\nTechnology Stack: {tech_stack}")
        
        # Add features/requirements
        if clarifications and "features" in clarifications:
            context_parts.append(f"\nKey Features:")
            context_parts.append(f"- {clarifications['features']}")
        elif analysis and analysis.mentioned_features:
            context_parts.append(f"\nKey Features:")
            for feature in analysis.mentioned_features[:5]:  # Limit to top 5
                if feature and len(feature) > 5:
                    context_parts.append(f"- {feature}")
        
        # Add design requirements
        if clarifications and "design" in clarifications:
            context_parts.append(f"\nDesign Requirements: {clarifications['design']}")
        
        full_context = "\n".join(context_parts)
        
        # Build system prompt based on detected technology
        base_system = """You are an expert software developer. Generate clean, production-ready code based on the user's requirements.

Guidelines:
1. Write complete, working code
2. Include necessary imports and dependencies
3. Add helpful comments explaining key parts
4. Follow best practices for the specified technology stack
5. Make the code modular and maintainable
6. Include error handling where appropriate
7. If it's an app/application, provide a complete structure with main files
8. Use modern, idiomatic code for the language/framework

Generate the actual code implementation, not a prompt or description. Include all necessary code to make it functional."""
        
        # Add technology-specific guidance
        if tech_stack:
            tech_lower = tech_stack.lower()
            if "ios" in tech_lower or "swift" in tech_lower or "iphone" in tech_lower:
                base_system += "\n\nFor iOS: Use Swift and SwiftUI. Include proper app structure with App file, Views, and Models. Provide complete, runnable code."
            elif "react" in tech_lower or "javascript" in tech_lower or "typescript" in tech_lower:
                base_system += "\n\nFor React: Use functional components with hooks. Include proper component structure and state management. Provide complete, runnable code."
            elif "python" in tech_lower:
                base_system += "\n\nFor Python: Use type hints, follow PEP 8, and include proper error handling. Provide complete, runnable code."
            elif "web" in tech_lower or "html" in tech_lower:
                base_system += "\n\nFor Web: Include HTML, CSS, and JavaScript. Make it responsive and modern. Provide complete, runnable code."
        
        # Use Gemini for code generation (complex task), fallback to Ollama
        code = self._call_model(full_context, base_system, task_type="complex", primary="gemini")
        
        # If code generation failed, check for errors
        if not code or len(code) < 50:
            if self._last_gemini_error or self._last_ollama_error:
                # Store error for potential display
                pass
        
        return code if code and len(code) > 50 else ""
    
    def _rewrite_prompt_for_llm(self, user_input: str, clarifications: Optional[Dict[str, str]] = None, intent: Optional[str] = None) -> str:
        """Use AI models to intelligently rewrite the entire prompt for better LLM understanding"""
        # Check if any model is available
        if not self.use_ollama and not self.gemini_api_key:
            # Fallback for no models: structure the basic input
            if clarifications:
                core_intent = self.analysis.core_intent if self.analysis else user_input
                return f"Goal: {core_intent}\nRequirements: {user_input}"
            return user_input
        
        # Build comprehensive context for rewriting
        context_parts = [f"Original request: {user_input}"]
        
        if clarifications:
            context_parts.append("\nClarifications:")
            for key, value in clarifications.items():
                # Map simple answers to full tech stack for context clarity
                if key == "technology":
                    value = self._map_simple_tech(value)
                context_parts.append(f"- {key}: {value}")
        
        full_context = "\n".join(context_parts)
        
        # Adjust system prompt based on intent
        if intent == "creative":
            system_prompt = """You are an expert prompt engineer specializing in optimizing prompts for creative AI tools (like Suno, Midjourney, Claude for creative tasks).

Your task is to rewrite the user's creative idea into a clear, detailed, and highly optimized prompt that will produce excellent creative output.

Guidelines:
1. Extract the core creative vision clearly
2. Include specific details about style, mood, tone, and aesthetic
3. Make it vivid and descriptive
4. Remove ambiguity while preserving creative intent
5. Structure it logically with clear specifications
6. Keep the same creative intent and meaning
7. Make it concise but complete with all important details

Return ONLY the rewritten prompt, nothing else. Do not include explanations or additional commentary."""
        elif intent == "document":
            system_prompt = """You are an expert prompt engineer specializing in optimizing prompts for document analysis and text processing AI (like GPT, Gemini, Claude).

Your task is to rewrite the user's request into a clear, structured, and highly optimized prompt for document/text analysis.

Guidelines:
1. Extract the core analysis requirement clearly
2. Specify what type of analysis is needed (summary, extraction, comparison, etc.)
3. Make it specific about what information to extract or analyze
4. Remove ambiguity and vague language
5. Structure it logically
6. Keep the same intent and meaning
7. Make it concise but complete

Return ONLY the rewritten prompt, nothing else. Do not include explanations or additional commentary."""
        else:
            system_prompt = """You are an expert prompt engineer specializing in optimizing prompts for AI code generation agents (like Cursor, Replit, GitHub Copilot).

Your task is to rewrite the user's request into a clear, structured, and highly optimized prompt that will be understood perfectly by an LLM code generation agent.

Guidelines:
1. Extract the core technical requirement clearly
2. Remove ambiguity and vague language
3. Make it specific and actionable
4. Use technical terminology appropriately
5. Structure it logically
6. Remove redundancy
7. DO NOT generate code - only rewrite the prompt to be clearer
8. Keep the same intent and meaning
9. Make it concise but complete

Return ONLY the rewritten prompt, nothing else. Do not include explanations, code, or additional commentary."""
        
        # Use Gemini for complex prompt rewriting, fallback to Ollama
        rewritten = self._call_model(full_context, system_prompt, task_type="complex", primary="gemini")
        
        # If model didn't provide a good rewrite, return the cleaned-up original input
        if rewritten and len(rewritten) > 20 and len(rewritten) < 2000:
            return rewritten.strip()
        
        # Fallback to first sentence or raw input
        return user_input.split('.')[0].strip() or user_input
    
    def _enhance_with_ollama(self, text: str, enhancement_type: str) -> str:
        """Use AI models to enhance a piece of text (simple task, prefers Ollama)"""
        # Check if any model is available
        if not self.use_ollama and not self.gemini_api_key:
            return text
        
        system_prompts = {
            "goal": """You are a technical prompt engineer. Rewrite the user's goal statement to be clear, concise, and actionable for an AI code generation agent. 
- Remove redundancy and make it specific
- Use technical language appropriately
- Make it a single, clear sentence
Return ONLY the enhanced goal, nothing else. No code, no explanations.""",
            "requirement": """You are a technical prompt engineer. Transform the user's feature description into a clear, actionable requirement for an AI code generation agent.
- Make it specific and technical
- Use action verbs (implement, enable, provide, support)
- Be concise but complete
Return ONLY the requirement, nothing else. No code, no explanations.""",
            "context": """You are a technical prompt engineer. Summarize the user's context in one clear sentence that explains the purpose without repeating the requirements.
- Focus on the "why" not the "what"
- Be concise
Return ONLY the summary, nothing else. No code, no explanations."""
        }
        
        system_prompt = system_prompts.get(enhancement_type, system_prompts["requirement"])
        # Use Ollama for simple enhancement tasks, fallback to Gemini
        enhanced = self._call_model(text, system_prompt, task_type="simple", primary="ollama")
        
        return enhanced if enhanced and len(enhanced) > 10 else text
    
    def _remove_redundancy(self, goal: str, requirements: List[str]) -> List[str]:
        """Remove requirements that are redundant with the goal"""
        goal_lower = goal.lower()
        goal_words = set(re.findall(r'\b\w+\b', goal_lower))
        
        filtered = []
        for req in requirements:
            req_lower = req.lower()
            req_words = set(re.findall(r'\b\w+\b', req_lower))
            
            # Check if requirement is too similar to goal (high word overlap)
            if len(req_words) > 0:
                overlap = len(goal_words & req_words) / len(req_words)
                # If more than 60% word overlap and requirement is similar length to goal, it's likely redundant
                if overlap > 0.6 and abs(len(req) - len(goal)) < 30:
                    continue
            
            # Check if requirement is just restating the goal
            if req_lower in goal_lower or goal_lower in req_lower:
                continue
            
            filtered.append(req)
        
        return filtered
    
    def _transform_to_requirement(self, text: str) -> str:
        """Transform a feature description into an actionable requirement"""
        text = text.strip()
        
        # If it's already action-oriented, return as is
        action_verbs = ["implement", "add", "create", "build", "develop", "enable", "support", "provide", "include", "allow", "implement"]
        if any(text.lower().startswith(verb) for verb in action_verbs):
            return text
        
        # Transform common patterns
        transformations = {
            r"^users?\s+(?:can|should|must|will)\s+": "Enable users to ",
            r"^the\s+system\s+(?:should|must|will)\s+": "Implement ",
            r"^(?:it|the\s+app|the\s+website)\s+(?:should|must|will|can)\s+": "Implement ",
            r"^have\s+": "Include ",
            r"^with\s+": "Include ",
        }
        
        for pattern, replacement in transformations.items():
            if re.match(pattern, text.lower()):
                text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
                return text
        
        # Transform gerunds and nouns to action verbs
        # "listing and selling" -> "Enable listing and selling"
        # "user accounts" -> "Implement user accounts"
        gerund_patterns = [
            (r"^(listing|selling|creating|managing|viewing|editing|deleting)", "Enable \\1"),
            (r"^(user\s+accounts?|authentication|payment)", "Implement \\1"),
        ]
        
        for pattern, replacement in gerund_patterns:
            if re.match(pattern, text.lower()):
                text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
                # Capitalize first letter
                if text[0].islower():
                    text = text[0].upper() + text[1:]
                return text
        
        # Default: make it action-oriented
        if not any(text.lower().startswith(v) for v in ["enable", "implement", "include", "provide", "support"]):
            # If it starts with a noun/gerund, add "Enable" or "Implement"
            if not any(text.lower().startswith(v) for v in action_verbs):
                # Check if it's a gerund or noun phrase
                if text.lower().startswith(("listing", "selling", "creating", "managing", "viewing", "editing", "deleting", "user", "account")):
                    text = f"Enable {text.lower()}"
                else:
                    text = f"Implement {text.lower()}"
            # Capitalize first letter
            if text[0].islower():
                text = text[0].upper() + text[1:]
        
        return text
    
    def _generate_optimized_creative_prompt(self, user_input: str, intent: str) -> str:
        """Generate an optimized prompt for creative/content requests"""
        # Use Ollama to optimize the rambling text into a clean prompt
        optimized_prompt = self._rewrite_prompt_for_llm(user_input, {}, intent)
        
        # Determine prompt type and format
        prompt_type = "General LLM Prompt"
        emoji = "🤖"
        
        if intent == "creative":
            if any(k in user_input.lower() for k in ["song", "music", "tune", "lyric", "melody"]):
                prompt_type = "Creative Music/Song Prompt"
                emoji = "🎤"
            elif any(k in user_input.lower() for k in ["image", "picture", "photo", "art", "drawing"]):
                prompt_type = "Creative Image Prompt"
                emoji = "🎨"
            else:
                prompt_type = "Creative Content Prompt"
                emoji = "✨"
        elif intent == "document":
            prompt_type = "Document Analysis Prompt"
            emoji = "📄"
        
        # Format the output
        output = f"## {emoji} Optimized Prompt for {prompt_type}\n\n"
        output += "**Goal:** " + (self._extract_core_intent(user_input) or "Process the user's request") + "\n\n"
        output += "**Prompt for LLM:**\n\n"
        output += f'"{optimized_prompt}"\n'
        
        return output
    
    def process_and_refine(self, user_input: str, clarifications: Optional[Dict[str, str]] = None) -> Dict[str, any]:
        """
        Analyzes chaotic input, classifies intent, asks for clarification if needed 
        (Code path), or generates the final optimized prompt (Creative/Document path).
        
        Returns:
            Dict with status and either questions, code, or optimized_prompt
        """
        self.clarifications = clarifications or {}
        analysis = self.analyze_input(user_input)
        
        # 1. Intent Classification
        intent = self._classify_intent(user_input)
        is_code_request = (intent == "code" or self._detect_code_request(user_input))
        
        if is_code_request and not self.clarifications.get('output_format'):
            # --- CODE PATH (Requires Clarification/Refinement) ---
            
            # Use clarified answers if provided to refine analysis
            if clarifications and "technology" in clarifications:
                # Update core intent based on clarified tech, e.g., 'building a web app'
                analysis.core_intent = f"Building a {self._map_simple_tech(clarifications['technology'])}"
            
            clarifying_questions = self.generate_clarifying_questions(analysis)
            
            # If ambiguity is low OR if key questions were just answered, ask about the output format
            if analysis.ambiguity_level == "low" or (len(clarifying_questions) < 3 and not self.clarifications.get('output_format')):
                # Ensure this critical question is asked for all code requests
                clarifying_questions.append(ClarifyingQuestion(
                    question="The project intent is clear. Do you want the AI to generate the **code implementation** or a **refined prompt** for another LLM?",
                    category="output_format"
                ))
            
            # If the user has provided enough clarification, proceed to final generation
            if self.clarifications.get('output_format', '').lower() == 'code':
                # --- FINAL CODE GENERATION PATH ---
                # Check if any model is available for code generation
                if self.use_ollama or self.gemini_api_key:
                    generated_code = self._generate_code_with_ollama(user_input, self.clarifications, analysis)
                    if generated_code:
                        return {
                            "status": "code_generated",
                            "message": "🏗️ Code implementation complete.",
                            "code": generated_code,
                            "technology_used": self._map_simple_tech(self.clarifications.get('technology', 'General'))
                        }
                    # Code generation failed, fall back to prompt generation
                else:
                    # No models available, return error
                    return {
                        "status": "error",
                        "message": "Code generation requested but no AI models available. Install Ollama or set GEMINI_API_KEY.",
                        "questions": []
                    }
            
            if clarifying_questions:
                # Still need more info
                return {
                    "status": "clarification_needed",
                    "message": "The system detects you want to **BUILD** a software product. The following information is needed to define the project:",
                    "questions": [{"question": q.question, "category": q.category} for q in clarifying_questions]
                }
            
            # Fallback if questions are empty but output format is unknown (should be rare)
            return {
                "status": "clarification_needed",
                "message": "What is the desired output? Code or a refined prompt?",
                "questions": [{"question": "Do you want the AI to generate the **code implementation** or a **refined prompt** for another LLM?", "category": "output_format"}]
            }
        
        else:
            # --- NON-CODE PATH (Creative, Document, General) ---
            
            # Use Ollama to optimize the rambling text into a clean prompt.
            optimized_prompt = self._rewrite_prompt_for_llm(user_input, clarifications, intent)
            
            # Determine the type of output block
            if intent == "creative":
                prompt_type = "Creative Content Prompt (e.g., Music AI, Image AI)"
                emoji = "🎤"
            elif intent == "document":
                prompt_type = "Document Analysis Prompt (e.g., Summary, Report)"
                emoji = "📄"
            else:
                prompt_type = "General LLM Prompt"
                emoji = "💡"
            
            return {
                "status": "prompt_generated",
                "message": f"{emoji} Optimized **{prompt_type}** ready for copy/paste!",
                "optimized_prompt": optimized_prompt,
                "goal": self._build_goal(user_input, analysis, clarifications)
            }
    
    def generate_final_prompt(self, user_input: str, clarifications: Optional[Dict[str, str]] = None, show_rewrite: bool = False) -> Tuple[str, Optional[str]]:
        """
        Step 3: Generate the final structured prompt OR code if requested
        
        Returns:
            Tuple of (final_output, rewritten_input) where:
            - final_output is either a prompt or generated code
            - rewritten_input is None if no rewrite occurred
        """
        # Check if user wants code
        wants_code = self._detect_code_request(user_input)
        
        # Check if user explicitly specified output format in clarifications
        if clarifications and "output_format" in clarifications:
            output_format = clarifications["output_format"].lower()
            if "code" in output_format or "implement" in output_format:
                wants_code = True
            elif "prompt" in output_format or "refined" in output_format:
                wants_code = False  # User wants prompt, not code
        
        # If user wants code and AI models are available, generate code
        if wants_code and (self.use_ollama or self.gemini_api_key):
            # Do a quick analysis to get better context for code generation
            quick_analysis = self.analyze_input(user_input)
            generated_code = self._generate_code_with_ollama(user_input, clarifications, quick_analysis)
            if generated_code:
                # Format the code output nicely
                code_output = "## 💻 GENERATED CODE\n\n"
                code_output += f"Based on your request: *{user_input}*\n\n"
                if clarifications:
                    code_output += "**Requirements:**\n"
                    for key, value in clarifications.items():
                        code_output += f"- {key}: {value}\n"
                    code_output += "\n"
                
                # Determine code language for syntax highlighting
                tech_stack = None
                if clarifications and "technology" in clarifications:
                    tech_stack = clarifications['technology'].lower()
                else:
                    detected = self._detect_technology(user_input)
                    if detected:
                        tech_stack = detected.lower()
                
                lang = ""
                if "swift" in tech_stack or "ios" in tech_stack or "iphone" in tech_stack:
                    lang = "swift"
                elif "react" in tech_stack or "javascript" in tech_stack:
                    lang = "javascript"
                elif "typescript" in tech_stack:
                    lang = "typescript"
                elif "python" in tech_stack:
                    lang = "python"
                elif "html" in tech_stack or "web" in tech_stack:
                    lang = "html"
                
                code_output += f"```{lang}\n"
                code_output += generated_code
                code_output += "\n```\n"
                return code_output, None
            # If code generation failed, fall through to prompt generation
            # but add a note that code was requested
        
        # Otherwise, generate a prompt as before
        rewritten_input = None
        # Intelligently rewrite the entire prompt using AI models for better LLM understanding
        if self.use_ollama or self.gemini_api_key:
            rewritten_input = self._rewrite_prompt_for_llm(user_input, clarifications)
            # Use rewritten input for analysis if it's significantly different
            if rewritten_input != user_input and len(rewritten_input) > 20:
                analysis_input = rewritten_input
            else:
                analysis_input = user_input
                rewritten_input = None  # No significant rewrite
        else:
            analysis_input = user_input
        
        # Always analyze the input (rewritten if available)
        original_analysis = self.analyze_input(analysis_input)
        
        # Build the structured prompt
        if wants_code:
            prompt = "## 🤖 CODE GENERATION PROMPT\n\n"
            if not self.use_ollama and not self.gemini_api_key:
                prompt += "> **Note:** Code generation requested, but no AI models are available. Install Ollama or set GEMINI_API_KEY to generate code directly.\n\n"
            else:
                error_msg = ""
                # Check for errors from either model
                if hasattr(self, '_last_gemini_error') and self._last_gemini_error:
                    if "Rate limit" in self._last_gemini_error:
                        error_msg = "Gemini rate limit exceeded. Falling back to Ollama or generating prompt."
                    elif "Server error" in self._last_gemini_error:
                        error_msg = "Gemini server error. Falling back to Ollama or generating prompt."
                    else:
                        error_msg = "Code generation failed. This is an optimized prompt for a code generation agent."
                elif hasattr(self, '_last_ollama_error') and self._last_ollama_error:
                    if "Connection error" in self._last_ollama_error:
                        error_msg = "Ollama connection failed. Falling back to Gemini or generating prompt."
                    elif "HTTP error" in self._last_ollama_error:
                        error_msg = "Ollama HTTP error. Falling back to Gemini or generating prompt."
                    else:
                        error_msg = "Code generation failed. This is an optimized prompt for a code generation agent."
                else:
                    error_msg = "Code generation was attempted but returned no code. This is an optimized prompt for a code generation agent."
                prompt += f"> **Note:** {error_msg}\n\n"
        else:
            prompt = "## 🤖 FINAL AI AGENT PROMPT\n\n"
        
        # Show rewrite info if requested and rewrite occurred
        if show_rewrite and rewritten_input:
            prompt += f"> **Optimized Input:** The original request has been intelligently rewritten for better LLM understanding.\n\n"
        
        # Goal - build from input, enhanced with clarifications
        goal = self._build_goal(analysis_input, original_analysis, clarifications)
        # Enhance with AI models if available
        if self.use_ollama or self.gemini_api_key:
            enhanced_goal = self._enhance_with_ollama(goal, "goal")
            if enhanced_goal:
                goal = enhanced_goal
        prompt += f"### 🎯 GOAL\n\n{goal}\n\n"
        
        # Requirements
        prompt += "### ⚙️ REQUIREMENTS (Mandatory)\n\n"
        requirements = []
        
        # Add technology requirements from clarifications or infer from input
        if clarifications and "technology" in clarifications:
            tech = clarifications['technology'].strip()
            # Map simple answers to full tech stack
            tech = self._map_simple_tech(tech)
            requirements.append(f"* Use {tech} as the primary technology stack")
        else:
            # Try to infer technology from original input
            tech_detected = self._detect_technology(user_input)
            if tech_detected:
                requirements.append(f"* Use {tech_detected} as the primary technology stack")
        
        # Add features from clarifications first (most important)
        if clarifications and "features" in clarifications:
            features_text = clarifications['features'].strip()
            
            # Transform to actionable requirement
            transformed = self._transform_to_requirement(features_text)
            
            # Check if it's a single feature description (contains connecting phrases)
            connecting_phrases = ["such as", "but not", "including", "for example", "like", "and", "or"]
            is_single_feature = any(phrase in features_text.lower() for phrase in connecting_phrases)
            
            # Only split if it looks like a list (multiple items, each substantial)
            if ',' in features_text and not is_single_feature:
                parts = [p.strip() for p in features_text.split(',')]
                # Only split if parts are roughly equal length AND don't start with connecting words
                connecting_starters = ["such", "but", "including", "for", "like", "and", "or"]
                parts_start_with_connectors = any(p.lower().split()[0] in connecting_starters for p in parts if p)
                
                if (len(parts) > 1 and 
                    all(len(p) > 15 for p in parts) and 
                    max(len(p) for p in parts) / min(len(p) for p in parts) < 3 and
                    not parts_start_with_connectors):
                    # Looks like a list - transform each part
                    for feat in parts:
                        if feat and len(feat) > 5:
                            transformed_feat = self._transform_to_requirement(feat)
                            requirements.append(f"* {transformed_feat}")
                else:
                    # Single feature with commas (like "such as X, Y, and Z")
                    requirements.append(f"* {transformed}")
            elif ';' in features_text:
                # Semicolons usually indicate separate items
                for feat in features_text.split(';'):
                    feat_clean = feat.strip()
                    if feat_clean and len(feat_clean) > 5:
                        transformed_feat = self._transform_to_requirement(feat_clean)
                        requirements.append(f"* {transformed_feat}")
            else:
                requirements.append(f"* {transformed}")
        
        # Add mentioned features from original input (filter out duplicates and goal redundancy)
        seen_features = set()
        feature_list = []
        
        for feature in original_analysis.mentioned_features:
            if feature and len(feature) > 5:  # Minimum length
                feature_clean = feature.strip()
                # Remove leading dashes/bullets if still present
                feature_clean = re.sub(r'^[\-\*\+\d\.\s]+', '', feature_clean).strip()
                # Skip if it looks like a clarification fragment
                if (feature_clean and 
                    "clarification" not in feature_clean.lower() and 
                    "technology:" not in feature_clean.lower() and
                    # Skip if it's just restating the goal
                    feature_clean.lower() not in goal.lower() and
                    goal.lower() not in feature_clean.lower()):
                    feature_list.append(feature_clean)
        
        # Smart deduplication and filtering
        feature_list.sort(key=len, reverse=True)
        for feature in feature_list:
            feature_lower = feature.lower().strip()
            
            # Skip if too similar to goal
            if goal.lower() in feature_lower or feature_lower in goal.lower():
                continue
            
            is_duplicate = False
            for seen in seen_features:
                seen_lower = seen.lower()
                # Check for substring matches (but allow similar length)
                if (feature_lower in seen_lower or seen_lower in feature_lower) and abs(len(feature_lower) - len(seen_lower)) > 15:
                    is_duplicate = True
                    break
                elif feature_lower == seen_lower:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                seen_features.add(feature_lower)
                # Transform generic descriptions into actionable requirements
                transformed = self._transform_to_requirement(feature)
                requirements.append(f"* {transformed}")
        
        # Add design from clarifications
        if clarifications and "design" in clarifications:
            requirements.append(f"* Design: {clarifications['design'].strip()}")
        
        if not requirements:
            requirements.append("* Follow best practices for the chosen technology stack")
            requirements.append("* Ensure code is clean, well-commented, and maintainable")
        
        # Remove redundant requirements that duplicate the goal
        requirements = self._remove_redundancy(goal, requirements)
        
        # Enhance requirements with AI models if available
        if self.use_ollama or self.gemini_api_key:
            enhanced_requirements = []
            for req in requirements:
                # Remove the bullet point for processing
                req_text = req.lstrip('* ').strip()
                enhanced = self._enhance_with_ollama(req_text, "requirement")
                if enhanced and len(enhanced) > 5:
                    enhanced_requirements.append(f"* {enhanced}")
                else:
                    enhanced_requirements.append(req)
            requirements = enhanced_requirements
        
        prompt += "\n".join(requirements) + "\n\n"
        
        # Visuals/UX (if applicable)
        if (clarifications and "design" in clarifications) or any(kw in user_input.lower() for kw in ["ui", "design", "look", "style", "color", "theme", "visual"]):
            prompt += "### ✨ VISUALS / USER EXPERIENCE\n\n"
            visual_items = []
            
            if clarifications and "design" in clarifications:
                visual_items.append(f"* {clarifications['design'].strip()}")
            else:
                visual_items.append("* Create a modern, clean, and intuitive user interface")
                visual_items.append("* Ensure responsive design for different screen sizes")
            
            prompt += "\n".join(visual_items) + "\n\n"
        
        # Constraints - only from original input, filter fragments carefully
        constraint_items = []
        
        # Get constraints from original analysis (not from clarifications merge)
        for constraint in original_analysis.mentioned_constraints:
            if constraint and len(constraint) > 10:
                # Filter out fragments - check if it looks like a complete thought
                constraint_clean = constraint.strip()
                # Skip if it's clearly a fragment (starts mid-word, very short, or contains clarification markers)
                if (constraint_clean[0].isupper() or constraint_clean[0].islower()) and \
                   "clarification" not in constraint_clean.lower() and \
                   "technology:" not in constraint_clean.lower() and \
                   "features:" not in constraint_clean.lower():
                    constraint_items.append(constraint_clean)
        
        # Add constraints from clarifications if provided
        if clarifications and "constraints" in clarifications:
            constraint_items.append(clarifications['constraints'].strip())
        
        # Remove duplicates and fragments
        final_constraints = []
        seen_constraints = set()
        for constraint in constraint_items:
            constraint_lower = constraint.lower()
            # Check for duplicates and fragments
            is_duplicate = False
            for seen in seen_constraints:
                if constraint_lower in seen or seen in constraint_lower:
                    if abs(len(constraint_lower) - len(seen)) > 10:
                        is_duplicate = True
                        break
            
            if not is_duplicate and len(constraint) > 10:
                seen_constraints.add(constraint_lower)
                final_constraints.append(constraint)
        
        if final_constraints:
            prompt += "### 🚫 CONSTRAINTS / EXCLUSIONS\n\n"
            prompt += "\n".join([f"* {c}" for c in final_constraints]) + "\n\n"
        
        # Context - use rewritten input if available
        context_input = analysis_input if (self.use_ollama or self.gemini_api_key) and analysis_input != user_input else user_input
        prompt += "### 📝 CONTEXT FROM USER (For Agent Reference)\n\n"
        context = self._build_context(context_input, original_analysis)
        # Enhance context with AI models if available
        if self.use_ollama or self.gemini_api_key:
            enhanced_context = self._enhance_with_ollama(context, "context")
            if enhanced_context:
                context = enhanced_context
        prompt += f"{context}\n"
        
        return prompt, rewritten_input


def get_clarified_prompt(raw_input: str, gemini_api_key: Optional[str] = None) -> Dict[str, any]:
    """
    Unified entry point for prompt clarification with dual-path reliability.
    
    This function encapsulates the logic for which model to use with automatic fallback.
    
    Args:
        raw_input: The user's raw, potentially chaotic input
        gemini_api_key: Optional Gemini API key (can also be set via GEMINI_API_KEY env var)
    
    Returns:
        Dict with status and either questions, code, or optimized_prompt
    """
    # Check if Ollama is available
    use_ollama = True
    try:
        result = subprocess.run(['ollama', '--version'], 
                              capture_output=True, 
                              timeout=2)
        if result.returncode != 0:
            use_ollama = False
    except (subprocess.TimeoutExpired, FileNotFoundError):
        use_ollama = False
    
    # Initialize engine with both models
    engine = ChaosToClarityEngine(
        use_ollama=use_ollama,
        gemini_api_key=gemini_api_key
    )
    
    # Process and refine the input
    return engine.process_and_refine(raw_input)


def main():
    """Interactive CLI for the Chaos-to-Clarity engine"""
    # Check if Ollama is available
    use_ollama = True
    try:
        result = subprocess.run(['ollama', '--version'], 
                              capture_output=True, 
                              timeout=2)
        if result.returncode != 0:
            use_ollama = False
    except (subprocess.TimeoutExpired, FileNotFoundError):
        use_ollama = False
    
    # Check for Gemini API key
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    
    engine = ChaosToClarityEngine(
        use_ollama=use_ollama,
        gemini_api_key=gemini_api_key
    )
    
    print("=" * 60)
    print("🤖 CHAOS-TO-CLARITY AI PROMPT ENGINEER")
    print("=" * 60)
    
    # Show model availability
    models_available = []
    if use_ollama:
        models_available.append("Ollama (local)")
    if gemini_api_key:
        models_available.append("Gemini (cloud)")
    
    if models_available:
        print(f"✨ Models available: {', '.join(models_available)}")
        print("   Dual-path reliability enabled with automatic fallback")
    else:
        print("ℹ️  No AI models detected")
        print("   Install Ollama or set GEMINI_API_KEY for enhanced processing")
    
    print("\nEnter your disorganized, rambling, or complex request:")
    print("(Type 'exit' to quit)\n")
    
    user_input = input("> ").strip()
    
    if user_input.lower() == 'exit':
        print("Goodbye!")
        return
    
    # Step 1: Process and classify intent
    print("\n[Analyzing input and classifying intent...]")
    clarifications = {}
    result = engine.process_and_refine(user_input, clarifications)
    
    # Step 2: Handle based on result status
    while result["status"] == "clarification_needed":
        # Need clarifications - ask questions
        questions = result["questions"]
        
        if questions:
            print(f"\n⚠️  Code/App Request Detected")
            print(f"\n{result['message']}\n")
            
            for i, q in enumerate(questions, 1):
                print(f"{i}. [{q['category'].upper()}] {q['question']}")
                answer = input(f"   Answer: ").strip()
                if answer:
                    clarifications[q['category']] = answer
            
            # Re-process with clarifications
            print("\n[Processing with clarifications...]")
            result = engine.process_and_refine(user_input, clarifications)
        else:
            break
    
    # Step 3: Handle final result
    if result["status"] == "code_generated":
        # Code was generated
        print(f"\n{result['message']}")
        print(f"Technology: {result.get('technology_used', 'N/A')}\n")
        print("=" * 60)
        print("## 💻 GENERATED CODE\n")
        print(f"```\n{result['code']}\n```")
        print("=" * 60)
    elif result["status"] == "prompt_generated":
        # Optimized prompt was generated
        print(f"\n{result['message']}\n")
        print("=" * 60)
        if "goal" in result:
            print(f"**Goal:** {result['goal']}\n")
        print(result["optimized_prompt"])
        print("=" * 60)
    else:
        # Fallback to old method for compatibility
        final_output, rewritten_input = engine.generate_final_prompt(
            user_input, 
            clarifications if clarifications else None,
            show_rewrite=True
        )
        
        print("\n" + "=" * 60)
        # Check if code was generated (starts with "## 💻")
        if final_output.startswith("## 💻"):
            print("💻 CODE GENERATED")
            print("=" * 60)
        elif rewritten_input and use_ollama:
            print("📝 PROMPT REWRITTEN FOR BETTER LLM UNDERSTANDING")
            print("=" * 60)
            print(f"\nOriginal: {user_input}")
            print(f"\nOptimized: {rewritten_input}\n")
            print("=" * 60)
        print("\n" + final_output)
        print("=" * 60)


if __name__ == "__main__":
    main()

