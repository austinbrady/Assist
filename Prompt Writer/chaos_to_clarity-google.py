"""
Chaos-to-Clarity AI Prompt Engineer (V3 - Self-Improving with Gemini & Ollama)

Transforms disorganized user input into optimized, structured prompts
or generates code directly, leveraging AI models (Gemini/Ollama) 
with preference for structured JSON output for analysis.

***UPDATED: 
- Enhanced prompts to leverage Gemini & Ollama for writing great prompts
- Self-improvement mechanism using Google API to rewrite prompts after each command
- Prompt improvement tracking and storage
***
"""

import re
import json
import os
import argparse
import sys
import subprocess
from typing import List, Dict, Optional, Tuple, Literal, Any
from dataclasses import dataclass, asdict
import urllib.request
import urllib.parse
from urllib.error import URLError, HTTPError
import time

# --- ADD THESE LINES TO LOAD THE .env FILE ---
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # If python-dotenv is not installed, the script will rely on
    # system environment variables or CLI arguments.
    pass
# ---------------------------------------------


# --- Dataclasses for Structured Data ---

@dataclass
class AnalysisResult:
    """Results from analyzing user input, designed for structured LLM output."""
    core_intent: str
    target_product: str
    mentioned_features: List[str]
    mentioned_constraints: List[str]
    # LLM-derived assessment of ambiguity level: "low", "medium", "high"
    ambiguity_level: str
    # LLM-derived list of missing information
    missing_info: List[str]

@dataclass
class ClarifyingQuestion:
    """A clarifying question to ask the user"""
    question: str
    category: str  # "technology", "features", "design", "constraints"


# --- Main Engine ---

class ChaosToClarityEngine:
    """Main engine for transforming chaotic input into clear prompts"""
    
    # JSON schema for the LLM to follow when analyzing input
    ANALYSIS_SCHEMA = {
        "type": "object",
        "properties": {
            "core_intent": {"type": "string", "description": "The main goal or purpose of the request."},
            "target_product": {"type": "string", "description": "The type of product or output (e.g., Web App, Python Script, Code Prompt, Creative Text)."},
            "mentioned_features": {"type": "array", "items": {"type": "string"}, "description": "A list of all key features or requirements mentioned."},
            "mentioned_constraints": {"type": "array", "items": {"type": "string"}, "description": "A list of all limitations, exclusions, or constraints mentioned."},
            "ambiguity_level": {"type": "string", "enum": ["low", "medium", "high"], "description": "Assessment of clarity. 'high' if critical info (tech/features) is missing."},
            "missing_info": {"type": "array", "items": {"type": "string"}, "description": "List of 3 most crucial missing technical or functional details."},
        },
        "required": ["core_intent", "target_product", "mentioned_features", "mentioned_constraints", "ambiguity_level", "missing_info"]
    }

    def __init__(self, use_ollama: bool = True, ollama_model: str = "llama3",
                 gemini_api_key: Optional[str] = None, enable_self_improvement: bool = True):
        self.use_ollama = use_ollama
        self.ollama_model = ollama_model
        self.gemini_api_key = gemini_api_key or os.getenv('GEMINI_API_KEY')
        self.enable_self_improvement = enable_self_improvement
        self._last_error = None
        
        # Storage for prompt improvements
        self.prompt_improvements_file = os.path.join(
            os.path.dirname(__file__), '.prompt_improvements.json'
        )
        self.prompt_improvements = self._load_improvements()
        
        # Current system prompts (will be improved over time)
        self.current_prompts = {
            'analysis': None,
            'code_generation': None,
            'clarification': None,
            'prompt_building': None
        }
        
        if not self.use_ollama and not self.gemini_api_key:
            print("⚠️ ERROR: Neither Ollama nor GEMINI_API_KEY are configured.")
            sys.exit(1)

    def _call_llm(self, prompt: str, system_prompt: Optional[str] = None,
                  model_name: str = "gemini-1.5-flash",
                  json_schema: Optional[Dict[str, Any]] = None,
                  timeout: int = 120) -> Tuple[Optional[Dict[str, Any]], str]:
        """Unified method to call Gemini or Ollama with fallback and structured output support."""
        
        # 1. Try Gemini first (preferred for complex analysis and structured output)
        if self.gemini_api_key:
            try:
                # Gemini API setup
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.gemini_api_key}"
                
                contents = [{"parts": [{"text": prompt}]}]
                payload = {"contents": contents}
                
                generation_config = {
                    "temperature": 0.7,
                    "maxOutputTokens": 4096,
                }
                
                if system_prompt:
                    # System instructions are part of the config in the current Gemini SDK style
                    payload["config"] = {"systemInstruction": system_prompt}
                
                if json_schema:
                    # Structured output request
                    generation_config["responseMimeType"] = "application/json"
                    generation_config["responseSchema"] = json_schema
                    
                payload["config"] = generation_config
                
                data = json.dumps(payload).encode('utf-8')
                req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
                
                with urllib.request.urlopen(req, timeout=timeout) as response:
                    result = json.loads(response.read().decode('utf-8'))
                    
                    if 'candidates' in result and len(result['candidates']) > 0:
                        response_text = result['candidates'][0]['content']['parts'][0].get('text', '').strip()
                        
                        if json_schema:
                            # Attempt to parse the structured JSON output
                            return json.loads(response_text), ""
                        else:
                            # Standard text output
                            return {"text": response_text}, ""
                    
            except HTTPError as e:
                self._last_error = f"Gemini HTTP error {e.code}: {e.reason}"
            except URLError as e:
                self._last_error = f"Gemini Connection error: {e.reason}"
            except json.JSONDecodeError:
                self._last_error = "Gemini returned invalid JSON (retrying with Ollama)."
            except Exception as e:
                self._last_error = f"Gemini Unexpected error: {type(e).__name__}"

        # 2. Fallback to Ollama
        if self.use_ollama:
            try:
                # Ollama API setup
                url = 'http://localhost:11434/api/generate'
                
                payload = {
                    "model": self.ollama_model,
                    "prompt": prompt,
                    "stream": False
                }
                
                # System prompt and JSON format for Ollama
                if system_prompt:
                    payload["system"] = system_prompt
                if json_schema:
                    # Ollama uses 'format: json' and expects the LLM to follow the instruction in the system prompt
                    payload["format"] = "json"
                
                data = json.dumps(payload).encode('utf-8')
                req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
                
                with urllib.request.urlopen(req, timeout=timeout) as response:
                    result = json.loads(response.read().decode('utf-8'))
                    response_text = result.get('response', '').strip()

                    if json_schema:
                        # Attempt to parse the structured JSON output
                        # Ollama response might be wrapped in ```json ... ```, so clean it
                        cleaned_text = re.sub(r'```json\s*|```', '', response_text, flags=re.DOTALL).strip()
                        return json.loads(cleaned_text), ""
                    else:
                        return {"text": response_text}, ""

            except (URLError, ConnectionRefusedError) as e:
                self._last_error = "Ollama connection failed. Is the service running?"
            except HTTPError as e:
                self._last_error = f"Ollama HTTP error: {e.code}"
            except json.JSONDecodeError:
                self._last_error = "Ollama returned invalid JSON."
            except Exception as e:
                self._last_error = f"Ollama Unexpected error: {type(e).__name__}"

        return None, self._last_error

    def _load_improvements(self) -> Dict[str, Any]:
        """Load prompt improvements from disk."""
        if os.path.exists(self.prompt_improvements_file):
            try:
                with open(self.prompt_improvements_file, 'r') as f:
                    return json.load(f)
            except:
                return {}
        return {}

    def _save_improvements(self):
        """Save prompt improvements to disk."""
        try:
            with open(self.prompt_improvements_file, 'w') as f:
                json.dump(self.prompt_improvements, f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save improvements: {e}")

    def _improve_prompt_with_gemini(self, prompt_type: str, current_prompt: str, 
                                     context: Dict[str, Any]) -> Optional[str]:
        """
        Use Gemini API to improve a prompt based on context and best practices.
        This leverages Gemini's advanced reasoning to write better prompts.
        """
        if not self.gemini_api_key or not self.enable_self_improvement:
            return None

        improvement_prompt = f"""You are an expert prompt engineer specializing in creating optimal prompts for AI models like Gemini and Ollama.

Your task is to improve the following {prompt_type} prompt to make it more effective at:
1. Leveraging Gemini's advanced reasoning and structured output capabilities
2. Leveraging Ollama's local processing and code generation strengths
3. Producing higher quality, more accurate results
4. Following prompt engineering best practices

CURRENT PROMPT:
```
{current_prompt}
```

CONTEXT FROM RECENT USAGE:
- User Input: {context.get('user_input', 'N/A')[:200]}
- Result Quality: {context.get('result_quality', 'unknown')}
- Issues Encountered: {context.get('issues', 'none')}

IMPROVEMENT GUIDELINES:
- Reference specific capabilities of Gemini (structured output, reasoning, code generation)
- Reference specific capabilities of Ollama (local processing, fast iteration)
- Make the prompt more specific and actionable
- Include examples or patterns that work well with these models
- Optimize for clarity and precision
- Ensure the prompt guides the model to produce excellent results

Return ONLY the improved prompt text, without any explanation or markdown formatting. The improved prompt should be ready to use directly."""

        try:
            result, error = self._call_llm(
                prompt=improvement_prompt,
                system_prompt="You are a prompt engineering expert. Your responses should be direct, actionable improvements to prompts.",
                model_name="gemini-1.5-pro",
                timeout=60
            )
            
            if result and "text" in result:
                improved = result["text"].strip()
                # Clean up any markdown formatting
                improved = re.sub(r'^```[a-z]*\n?', '', improved, flags=re.MULTILINE)
                improved = re.sub(r'\n?```$', '', improved, flags=re.MULTILINE)
                return improved.strip()
        except Exception as e:
            print(f"Warning: Prompt improvement failed: {e}")
        
        return None

    def analyze_input(self, user_input: str, history: Optional[str] = None) -> AnalysisResult:
        """
        Step 1: Analyze user input using LLM with structured JSON output.
        Uses Gemini & Ollama to write great prompts for analysis.
        """
        # Get or create improved analysis prompt
        if self.current_prompts['analysis']:
            system_prompt = self.current_prompts['analysis']
        else:
            system_prompt = (
                "You are a sophisticated prompt analysis engine powered by Gemini and Ollama. "
                "Your expertise comes from understanding how these models excel at structured reasoning and analysis. "
                "Leverage Gemini's advanced JSON schema capabilities and Ollama's fast local processing. "
                "Analyze the user's request (which may be chaotic or vague) and extract the core components with precision. "
                "Think deeply about what makes a great prompt - clarity, specificity, and actionable structure. "
                "Your output MUST be a JSON object that strictly adheres to the provided schema. "
                "Use Gemini's structured output features to ensure perfect JSON formatting."
            )
            self.current_prompts['analysis'] = system_prompt

        # Include history in the prompt for the LLM to use during analysis
        if history:
            prompt_with_history = f"**PREVIOUS CONVERSATION CONTEXT:**\n```json\n{history}\n```\n\nCHAOTIC INPUT: \"{user_input}\""
        else:
            prompt_with_history = f"CHAOTIC INPUT: \"{user_input}\""
        
        json_data, error = self._call_llm(
            prompt=prompt_with_history,
            system_prompt=system_prompt,
            json_schema=self.ANALYSIS_SCHEMA,
            model_name="gemini-1.5-pro", # Use Pro for better structured reasoning
            timeout=90
        )
        
        analysis_result = None
        if json_data:
            try:
                # Safely initialize the dataclass from the parsed JSON
                analysis_result = AnalysisResult(**json_data)
            except TypeError as e:
                self._last_error = f"Failed to parse LLM analysis output: {e}"

        # Fallback to a default, empty analysis result if the LLM call fails
        if not analysis_result:
            analysis_result = AnalysisResult(
                core_intent=user_input.split('.')[0][:50].strip() or "General request",
                target_product="Unknown",
                mentioned_features=[],
                mentioned_constraints=[],
                ambiguity_level="high",
                missing_info=["Analysis failed. Check LLM setup."],
            )

        # Self-improvement: Improve the analysis prompt after use
        if self.enable_self_improvement and self.gemini_api_key:
            context = {
                'user_input': user_input,
                'result_quality': 'good' if analysis_result.ambiguity_level != 'high' else 'needs_improvement',
                'issues': error if error else 'none'
            }
            improved = self._improve_prompt_with_gemini('analysis', system_prompt, context)
            if improved:
                self.current_prompts['analysis'] = improved
                self.prompt_improvements[f'analysis_{len(self.prompt_improvements)}'] = {
                    'timestamp': time.time(),
                    'old': system_prompt,
                    'new': improved,
                    'context': context
                }
                self._save_improvements()

        return analysis_result

    def generate_clarifying_questions(self, analysis: AnalysisResult) -> List[ClarifyingQuestion]:
        """
        Step 2: Generate up to 3 clarifying questions if ambiguity is high.
        """
        questions = []
        
        if analysis.ambiguity_level == "low" and not analysis.missing_info:
            return questions
        
        # Priority 1: Missing Technology/Product
        if "Technology stack not specified" in str(analysis.missing_info) or analysis.target_product == "Unknown":
            questions.append(ClarifyingQuestion(
                question="What kind of product is this? (e.g., a standard **website**, an **iPhone/Android app**, or an **automation script/tool**?)",
                category="technology"
            ))
        
        # Priority 2: Key features/functionality
        if not analysis.mentioned_features:
            questions.append(ClarifyingQuestion(
                question="What is the single most critical function or feature the user must be able to perform in this application?",
                category="features"
            ))
        
        # Priority 3: Constraints/Design
        if "constraints" not in str(analysis.mentioned_constraints).lower():
            questions.append(ClarifyingQuestion(
                question="Are there any specific constraints (e.g., must use Python, must avoid a database, must be a simple command-line tool)?",
                category="constraints"
            ))

        # Always add the final output question if ambiguity is resolved
        if analysis.ambiguity_level != "high" and len(questions) < 3:
             questions.append(ClarifyingQuestion(
                question="Do you want the AI to generate the **code implementation** or a **refined prompt** for another LLM?",
                category="output_format"
            ))
        
        return questions[:3]

    def generate_assumptions_for_question(self, question: ClarifyingQuestion, user_input: str, analysis: AnalysisResult) -> List[str]:
        """
        Generate 3 intelligent assumptions about what the user might be trying to communicate
        for a given clarifying question.
        """
        assumption_prompt = f"""Based on the user's request and the context, generate 3 specific, intelligent assumptions about what the user likely means for this question.

USER'S ORIGINAL REQUEST: "{user_input}"

CONTEXT:
- Core Intent: {analysis.core_intent}
- Target Product: {analysis.target_product}
- Mentioned Features: {', '.join(analysis.mentioned_features) if analysis.mentioned_features else 'None'}

QUESTION TO ANSWER: [{question.category.upper()}] {question.question}

Generate 3 specific, realistic assumptions about what the user likely wants. Each assumption should be:
1. Specific and actionable (not vague)
2. Based on the user's original request
3. A reasonable interpretation of their intent
4. Different from the other assumptions

Return ONLY a JSON array of exactly 3 strings, each representing one assumption. No explanation, no markdown, just the JSON array.

Example format: ["assumption 1", "assumption 2", "assumption 3"]"""

        json_schema = {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 3,
            "maxItems": 3
        }

        result, error = self._call_llm(
            prompt=assumption_prompt,
            system_prompt="You are an expert at understanding user intent. Generate specific, realistic assumptions based on context.",
            json_schema=json_schema,
            model_name="gemini-1.5-flash",
            timeout=60
        )

        # Handle different response formats
        assumptions_list = None
        if result:
            if isinstance(result, list):
                assumptions_list = result
            elif isinstance(result, dict) and "text" in result:
                # Try to parse if wrapped in text
                try:
                    assumptions_list = json.loads(result["text"])
                except (json.JSONDecodeError, TypeError):
                    pass
        
        if assumptions_list and isinstance(assumptions_list, list) and len(assumptions_list) >= 3:
            return assumptions_list[:3]
        
        # Fallback assumptions based on category
        fallback_assumptions = {
            "technology": [
                "A standard website/web application",
                "A mobile app (iPhone/Android)",
                "A command-line tool or automation script"
            ],
            "features": [
                "User authentication and login",
                "Data storage and retrieval",
                "Real-time communication or notifications"
            ],
            "constraints": [
                "No specific constraints - use best practices",
                "Must use Python",
                "Must be simple and lightweight"
            ],
            "output_format": [
                "Generate the code implementation",
                "Generate a refined prompt for another LLM",
                "Generate both code and documentation"
            ]
        }
        
        return fallback_assumptions.get(question.category, ["Option 1", "Option 2", "Option 3"])

    def _build_final_prompt(self, user_input: str, analysis: AnalysisResult, clarifications: Dict[str, str], history: Optional[str] = None) -> str:
        """
        Constructs a highly structured prompt for a Code Generation LLM.
        Uses Gemini & Ollama best practices to create excellent prompts.
        """
        
        # Extract and incorporate clarifications
        tech_stack = clarifications.get('technology', analysis.target_product)
        features = clarifications.get('features')
        constraints = clarifications.get('constraints')
        
        # Use improved prompt building approach leveraging Gemini & Ollama
        if not self.current_prompts['prompt_building']:
            self.current_prompts['prompt_building'] = (
                "When building prompts, leverage Gemini's structured reasoning and Ollama's code generation strengths. "
                "Create prompts that are clear, specific, and actionable. Reference model capabilities explicitly."
            )
        
        # Build the final prompt content with enhanced structure
        prompt_content = f"## 🤖 CODE GENERATION PROMPT (Optimized by Chaos-to-Clarity using Gemini & Ollama)\n\n"
        prompt_content += "### 🎯 GOAL\n\n"
        prompt_content += f"**Core Intent:** {analysis.core_intent.strip() or 'The user needs code.'}\n\n"
        
        prompt_content += "### 🛠️ TECHNOLOGY STACK\n\n"
        prompt_content += f"* **Primary:** {tech_stack.strip() or 'To be determined by the best fit.'}\n\n"
        
        prompt_content += "### ✨ KEY REQUIREMENTS\n\n"
        
        reqs = []
        if features:
            reqs.append(f"* **Clarified Feature:** {features.strip()}")
        
        for feature in analysis.mentioned_features:
            reqs.append(f"* {feature.strip()}")
            
        if not reqs:
            reqs.append("* Implement all core functionality to satisfy the goal.")
            
        prompt_content += "\n".join(reqs) + "\n\n"
        
        prompt_content += "### 🚫 CONSTRAINTS / EXCLUSIONS\n\n"
        
        cons = []
        if constraints:
            cons.append(f"* **Clarified Constraint:** {constraints.strip()}")
            
        for constraint in analysis.mentioned_constraints:
            cons.append(f"* {constraint.strip()}")
            
        if not cons:
            cons.append("* None explicitly specified.")
            
        prompt_content += "\n".join(cons) + "\n\n"
        
        prompt_content += "### 📝 CONTEXT (Original User Input)\n\n"
        prompt_content += f"```text\n{user_input}\n```\n"

        # NEW: Include conversation history for context
        if history:
            prompt_content += "\n### 💬 PREVIOUS CONVERSATION HISTORY\n\n"
            prompt_content += f"```json\n{history}\n```\n"
        
        return prompt_content

    def _generate_code(self, full_prompt: str, tech_stack: str) -> str:
        """
        Use Gemini & Ollama to generate code based on the highly structured prompt.
        Leverages both models' strengths for excellent code generation.
        """
        # Get or create improved code generation prompt
        if self.current_prompts['code_generation']:
            base_prompt = self.current_prompts['code_generation']
            # Replace placeholder if it exists, otherwise use as-is
            if '{tech_stack}' in base_prompt:
                system_prompt = base_prompt.replace('{tech_stack}', tech_stack)
            else:
                system_prompt = base_prompt
        else:
            system_prompt = (
                "You are an expert AI Code Generation Agent powered by Gemini and Ollama. "
                "Leverage Gemini's advanced reasoning for complex logic and Ollama's fast iteration for code structure. "
                f"Your task is to generate complete, runnable, production-quality code for a {tech_stack} project. "
                "Use Gemini's structured thinking to plan the architecture, then generate clean, well-commented code. "
                "Strictly follow the GOAL, TECHNOLOGY STACK, and KEY REQUIREMENTS provided in the prompt. "
                "Write code that is maintainable, follows best practices, and includes error handling. "
                "Wrap the code in a single markdown code block (` ```[language] ... ``` `)."
            )
            # Store template version for future use
            self.current_prompts['code_generation'] = (
                "You are an expert AI Code Generation Agent powered by Gemini and Ollama. "
                "Leverage Gemini's advanced reasoning for complex logic and Ollama's fast iteration for code structure. "
                "Your task is to generate complete, runnable, production-quality code for a {tech_stack} project. "
                "Use Gemini's structured thinking to plan the architecture, then generate clean, well-commented code. "
                "Strictly follow the GOAL, TECHNOLOGY STACK, and KEY REQUIREMENTS provided in the prompt. "
                "Write code that is maintainable, follows best practices, and includes error handling. "
                "Wrap the code in a single markdown code block (` ```[language] ... ``` `)."
            )
        
        # Set a longer timeout for code generation
        result, error = self._call_llm(
            prompt=full_prompt,
            system_prompt=system_prompt,
            model_name="gemini-1.5-pro", # Use a more powerful model for code
            timeout=180
        )
        
        generated_code = ""
        if result and "text" in result:
            generated_code = result["text"].strip()

        # Self-improvement: Improve the code generation prompt after use
        if self.enable_self_improvement and self.gemini_api_key:
            context = {
                'user_input': full_prompt[:200],
                'result_quality': 'good' if len(generated_code) > 100 else 'needs_improvement',
                'issues': error if error else 'none',
                'tech_stack': tech_stack
            }
            # Use the template version for improvement
            template_prompt = self.current_prompts['code_generation'] or system_prompt
            improved = self._improve_prompt_with_gemini('code_generation', template_prompt, context)
            if improved:
                # Ensure the improved prompt uses {tech_stack} placeholder for templating
                if tech_stack in improved and '{tech_stack}' not in improved:
                    improved = improved.replace(tech_stack, '{tech_stack}')
                elif '{tech_stack}' not in improved and 'tech_stack' not in improved.lower():
                    # Add placeholder if missing
                    improved = improved.replace('project', '{tech_stack} project', 1) if 'project' in improved else improved
                self.current_prompts['code_generation'] = improved
                self.prompt_improvements[f'code_gen_{len(self.prompt_improvements)}'] = {
                    'timestamp': time.time(),
                    'old': template_prompt,
                    'new': improved,
                    'context': context
                }
                self._save_improvements()

        return generated_code

    def process_request(self, user_input: str, clarifications: Dict[str, str], history: Optional[str] = None) -> Dict[str, Any]:
        """
        Main logic flow: Analysis -> Clarification -> Final Output.
        (Updated to pass conversation history for context).
        """
        
        # Step 1: Analyze
        analysis = self.analyze_input(user_input, history)
        
        # Step 2: Clarification Check
        if analysis.ambiguity_level == "high" and not clarifications.get('output_format'):
            questions = self.generate_clarifying_questions(analysis)
            if questions:
                return {
                    "status": "clarification_needed",
                    "message": "The input is highly ambiguous and requires clarification before proceeding.",
                    "questions": [asdict(q) for q in questions]
                }
        
        # Update analysis with explicit clarifications
        if clarifications.get('technology'):
            analysis.target_product = clarifications['technology']

        # Determine output format
        output_format = clarifications.get('output_format', 'refined prompt').lower()
        wants_code = "code" in output_format or "implement" in output_format
        
        final_prompt_content = self._build_final_prompt(user_input, analysis, clarifications, history)

        # Self-improvement: Improve prompt building after generating final prompt
        if self.enable_self_improvement and self.gemini_api_key and self.current_prompts['prompt_building']:
            context = {
                'user_input': user_input[:200],
                'result_quality': 'good',
                'issues': 'none',
                'prompt_length': len(final_prompt_content)
            }
            improved = self._improve_prompt_with_gemini('prompt_building', self.current_prompts['prompt_building'], context)
            if improved:
                self.current_prompts['prompt_building'] = improved
                self.prompt_improvements[f'prompt_building_{len(self.prompt_improvements)}'] = {
                    'timestamp': time.time(),
                    'old': self.current_prompts['prompt_building'],
                    'new': improved,
                    'context': context
                }
                self._save_improvements()

        if wants_code:
            # --- FINAL CODE GENERATION PATH ---
            tech_stack = clarifications.get('technology', analysis.target_product)
            generated_code = self._generate_code(final_prompt_content, tech_stack)
            
            if generated_code and len(generated_code) > 50:
                return {
                    "status": "code_generated",
                    "message": "🏗️ Code implementation complete.",
                    "code": generated_code,
                    "technology_used": tech_stack
                }
            else:
                return {
                    "status": "error",
                    "message": f"Code generation failed. Last LLM error: {self._last_error or 'Unknown error.'}. Providing optimized prompt instead.",
                    "optimized_prompt": final_prompt_content,
                    "goal": analysis.core_intent
                }
        else:
            # --- REFINED PROMPT PATH ---
            # Enhance the final prompt using Gemini & Ollama before returning
            enhanced_prompt = self._enhance_final_prompt_with_ai(final_prompt_content)
            
            return {
                "status": "prompt_generated",
                "message": "💡 Optimized Prompt ready for copy/paste! (Enhanced using Gemini & Ollama)",
                "optimized_prompt": enhanced_prompt if enhanced_prompt else final_prompt_content,
                "goal": analysis.core_intent
            }

    def _enhance_final_prompt_with_ai(self, prompt: str) -> Optional[str]:
        """
        Use Gemini & Ollama to enhance the final prompt, making it even better.
        This leverages both models to write great prompts.
        """
        if not self.gemini_api_key:
            return None

        enhancement_prompt = f"""You are an expert at writing excellent prompts for AI models like Gemini and Ollama.

Review and enhance the following prompt to make it more effective. The prompt should:
1. Clearly leverage Gemini's structured output and reasoning capabilities
2. Reference Ollama's strengths for local processing and code generation
3. Be more specific, actionable, and clear
4. Follow prompt engineering best practices
5. Include explicit instructions that work well with both models

CURRENT PROMPT:
```
{prompt}
```

Return ONLY the enhanced prompt, ready to use. Make it significantly better while preserving all the original information."""

        try:
            result, error = self._call_llm(
                prompt=enhancement_prompt,
                system_prompt="You are a prompt engineering expert. Return only the improved prompt text.",
                model_name="gemini-1.5-pro",
                timeout=60
            )
            
            if result and "text" in result:
                enhanced = result["text"].strip()
                # Clean up any markdown formatting
                enhanced = re.sub(r'^```[a-z]*\n?', '', enhanced, flags=re.MULTILINE)
                enhanced = re.sub(r'\n?```$', '', enhanced, flags=re.MULTILINE)
                return enhanced.strip()
        except Exception as e:
            print(f"Warning: Prompt enhancement failed: {e}")
        
        return None


def main():
    """Main entry point for the CLI application."""
    parser = argparse.ArgumentParser(
        description="Chaos-to-Clarity AI Prompt Engineer - Transform chaotic input into structured prompts or code.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    
    parser.add_argument(
        '--no-ollama', action='store_true',
        help='Do not attempt to use Ollama (requires GEMINI_API_KEY).'
    )
    parser.add_argument(
        '-m', '--ollama-model', type=str, default='llama3',
        help='Specify the Ollama model (default: llama3).'
    )
    parser.add_argument(
        '-k', '--gemini-key', type=str, default=os.environ.get('GEMINI_API_KEY'),
        help='Provide your Gemini API key (can also use GEMINI_API_KEY environment variable).'
    )
    parser.add_argument(
        '-c', '--history', type=str, default=None,
        help='Optional: Provide previous conversation history as a JSON string for context awareness.'
    )
    parser.add_argument(
        '--no-self-improvement', action='store_true',
        help='Disable self-improvement mechanism that uses Google API to rewrite prompts after each command.'
    )
    
    args = parser.parse_args()
    
    print("\n\n" + "=" * 60)
    print("Chaos-to-Clarity AI Prompt Engineer (V2)")
    print("=" * 60)
    
    try:
        engine = ChaosToClarityEngine(
            use_ollama=not args.no_ollama,
            ollama_model=args.ollama_model,
            gemini_api_key=args.gemini_key,
            enable_self_improvement=not args.no_self_improvement
        )
    except SystemExit:
        print("\n\nExiting due to missing configuration.")
        return

    print(f"**Configuration:**")
    print(f"  - Ollama: {'Enabled' if engine.use_ollama else 'Disabled'} (Model: {engine.ollama_model})")
    print(f"  - Gemini: {'Enabled' if engine.gemini_api_key else 'Disabled'} (Key via CLI/Env Var)")
    print(f"  - Self-Improvement: {'Enabled' if engine.enable_self_improvement else 'Disabled'} (Uses Google API to improve prompts)")
    print("-" * 60)
    
    user_input = input("Enter your chaotic request (e.g., 'I need a simple website with user login'):\n> ").strip()
    
    if not user_input:
        print("No input provided. Exiting.")
        return

    # Pass the history argument if provided
    history_context = args.history

    clarifications = {}
    # Get initial analysis for generating assumptions
    initial_analysis = engine.analyze_input(user_input, history_context)
    result = engine.process_request(user_input, clarifications, history=history_context)

    while result["status"] == "clarification_needed":
        questions = result["questions"]
        print(f"\n⚠️ Clarification Needed: {result['message']}\n")
        
        # Ask questions one at a time
        for q_dict in questions:
            q = ClarifyingQuestion(**q_dict)
            
            # Generate assumptions for this question
            print(f"\n[{q.category.upper()}] {q.question}\n")
            assumptions = engine.generate_assumptions_for_question(q, user_input, initial_analysis)
            
            # Display options 1, 2, 3, 4
            for i, assumption in enumerate(assumptions, 1):
                print(f"  {i}. {assumption}")
            print(f"  4. Other (type your own answer)")
            
            # Get user's choice
            while True:
                choice = input(f"\n  [{q.category.upper()}] Select option (1-4): ").strip()
                
                if choice == "1":
                    clarifications[q.category] = assumptions[0]
                    break
                elif choice == "2":
                    clarifications[q.category] = assumptions[1]
                    break
                elif choice == "3":
                    clarifications[q.category] = assumptions[2]
                    break
                elif choice == "4":
                    custom_answer = input(f"  [{q.category.upper()}] Enter your answer: ").strip()
                    if custom_answer:
                        clarifications[q.category] = custom_answer
                        break
                    else:
                        print("  Please enter a valid answer.")
                else:
                    print("  Invalid choice. Please enter 1, 2, 3, or 4.")

        # Rerun process with new clarifications
        print("\nRe-analyzing with clarifications...")
        # Note: We do NOT pass the initial history again in the clarification loop
        # as the model is already using the initial input + the running clarifications
        result = engine.process_request(user_input, clarifications)

    # --- Step 3: Handle Final Result ---
    
    print("\n" + "=" * 60)
    
    if result["status"] == "code_generated":
        print(f"{result['message']}")
        print(f"Technology: {result.get('technology_used', 'N/A')}\n")
        print("## 💻 GENERATED CODE")
        # LLM response should already be wrapped in ```
        print(f"\n{result['code']}\n")
        
    elif result["status"] == "prompt_generated":
        print(f"{result['message']}")
        print(f"**Goal:** {result['goal']}\n")
        print(result["optimized_prompt"])
        
    elif result["status"] == "error":
        print(f"❌ ERROR: {result['message']}")
        if "optimized_prompt" in result:
             print("\n## 📝 FALLBACK: Optimized Prompt")
             print(result["optimized_prompt"])
    
    print("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nOperation interrupted by user. Exiting.")
        sys.exit(0)