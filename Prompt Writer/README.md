# Chaos-to-Clarity AI Prompt Engineer

Transform disorganized, rambling, or complex English text input into highly optimized, structured, and concise prompts ready for AI code generation agents (like Replit or Cursor).

## Features

- **Dual-Path Reliability**: Uses Ollama (local) for simple tasks and Gemini (cloud) for complex tasks, with automatic fallback if one fails
- **Intelligent Prompt Rewriting**: Uses AI models to intelligently rewrite your entire prompt for optimal LLM understanding - transforms vague, rambling input into clear, structured prompts
- **Code Generation**: Automatically detects when users request code (e.g., "build an app", "create a website") and generates actual code using the best available model. Falls back gracefully if models are unavailable
- **Smart Code Detection**: Recognizes code requests from phrases like "build an app", "create a website", "write code for", etc.
- **Intent Classification**: Automatically classifies requests as code/app, creative content, or document analysis
- **AI-Enhanced Processing**: Uses Ollama (local LLM) to refine and enhance each section (goal, requirements, context), removing redundancy and improving clarity
- **Intelligent Analysis**: Automatically deconstructs user input to identify core intent, desired outcomes, features, and constraints
- **Ambiguity Detection**: Evaluates input for missing, vague, or contradictory information
- **Smart Clarification**: Asks up to 3 targeted questions when ambiguity is detected
- **Structured Output**: Generates prompts in a standardized Markdown format optimized for AI agents
- **Redundancy Removal**: Automatically removes duplicate information between goal and requirements

## Installation

### Basic Installation

This tool uses only Python standard library for core functionality. However, for enhanced prompt generation, you can optionally use Ollama (local) or Gemini (cloud) for AI processing.

### Dual-Path Reliability Architecture

The tool uses a **dual-path reliability system** with automatic fallback:

- **Primary for Simple Tasks (Classification, Feature Extraction)**: Ollama (local, fast, free)
- **Primary for Complex Tasks (Prompt Rewriting, Code Generation)**: Gemini (cloud, high-quality reasoning)
- **Automatic Fallback**: If one model fails, automatically switches to the other

### Setup Options

#### Option 1: Ollama (Local, Free)

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull a model: `ollama pull llama3.2` (or another model)
3. The tool will automatically detect and use Ollama

#### Option 2: Gemini (Cloud, High Quality)

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Set environment variable: `export GEMINI_API_KEY=your_key_here`
   - Or pass it when initializing: `ChaosToClarityEngine(gemini_api_key="your_key")`

#### Option 3: Both (Recommended for Maximum Reliability)

Set up both Ollama and Gemini for:
- **Zero downtime**: If one fails, automatically uses the other
- **Optimal performance**: Uses the best model for each task type
- **Cost efficiency**: Uses free local Ollama for simple tasks, Gemini for complex ones

The tool works without any models, but prompts will be basic. With models, prompts are intelligently enhanced and refined.

## Usage

### Command Line Interface

Run the interactive CLI:

```bash
python chaos_to_clarity.py
```

Then enter your request when prompted. The tool will:
1. Analyze your input
2. Ask clarifying questions if needed (up to 3)
3. Generate a structured prompt ready for AI code generation

### Example

**Input:**
```
I want to build a website for my business. It should look good and have some features.
```

**Output:**
The tool will ask clarifying questions like:
- What is the preferred technology stack? (React/Next.js, Python/Django, or simple HTML/CSS/JavaScript?)
- What is the single most critical function the user must be able to perform?
- Is there a specific visual style or color scheme?

Then generate a structured prompt in the format:

```markdown
## 🤖 FINAL AI AGENT PROMPT

### 🎯 GOAL
[Clear objective]

### ⚙️ REQUIREMENTS (Mandatory)
* [Feature 1]
* [Feature 2]

### ✨ VISUALS / USER EXPERIENCE
* [Design details]

### 🚫 CONSTRAINTS / EXCLUSIONS
* [Limitations]

### 📝 CONTEXT FROM USER (For Agent Reference)
[Purpose/motivation]
```

## How It Works

### Step 1: Analyze and Refine
- Deconstructs the input to identify core intent and desired outcome
- Extracts mentioned features and constraints
- Evaluates ambiguity level (low/medium/high)

### Step 2: Engage (If Necessary)
- Only asks questions if ambiguity is high enough to risk incorrect generation
- Asks up to 3 targeted questions about:
  - Technology stack
  - Key features/functionality
  - Design/interface preferences

### Step 3: Generate Final Prompt or Code
- **Code Generation**: If user requests code (e.g., "build an app") and Ollama is available, generates actual working code
- **Intelligent Rewriting**: If Ollama is available, the entire prompt is rewritten for optimal LLM understanding
- **Smart Fallback**: If code is requested but Ollama unavailable, creates optimized prompts for code generation agents
- Consolidates all information
- Structures output in optimized Markdown format
- Enhances each section with Ollama for clarity and precision
- Minimizes token usage for cost efficiency

## Use Cases

- Preparing prompts for AI coding assistants
- Clarifying vague project requirements
- Structuring technical specifications
- Converting informal requests into actionable prompts

## License

Free to use and modify.

