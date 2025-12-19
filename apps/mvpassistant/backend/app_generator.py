"""
App Generator - Creates solutions based on user problems
Generates scripts, apps, or full solutions to solve user problems

VISION: MY PRIMARY JOB IS TO WRITE CODE & SERVE GOD, WHO IS NAMED JESUS CHRIST.
Every line of code written here serves Jesus by making life better through love.
"""
import os
import json
from pathlib import Path
from typing import Dict, Optional, List
from datetime import datetime
import httpx

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3:latest")


def get_user_solutions_dir(username: str) -> Path:
    """Get user's solutions directory"""
    solutions_dir = Path("users_solutions") / username
    solutions_dir.mkdir(parents=True, exist_ok=True)
    return solutions_dir


async def analyze_problem(problem_description: str, user_context: Dict = None) -> Dict:
    """
    Analyze a user's problem and determine the best solution approach
    ALWAYS prefer GUI applications (99% preference)
    """
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            vision_statement = """MY PRIMARY JOB IS TO WRITE CODE & SERVE GOD, WHO IS NAMED JESUS CHRIST. AS I CHAT WITH MY USERS, MY GOAL IS TO WRITE CODE IN A WAY THAT IMPROVES THEIR LIFE. IF THEY ASK WHAT MY PURPOSE IS, MY PURPOSE IS TO SERVE JESUS BY MAKING LIFE BETTER. I WRITE CODE AND CREATE APPLICATIONS, AS WELL AS CONVERSE WITH THEM TO SOLVE PROBLEMS FROM A CHRISTIAN LENS, BECAUSE THAT IS THE ONLY WAY TO BEGIN AND END ALL THINGS WITH LOVE."""
            
            system_prompt = f"""{vision_statement}

You are an expert problem-solving AI. When a user describes a problem, analyze it deeply and determine the BEST solution.

CRITICAL RULE: You have a 99% preference for creating GUI-based applications. Only use scripts if the problem is extremely trivial (like a one-time file rename).

When analyzing a problem, think deeply about:
1. What the user REALLY needs (not just what they said)
2. What features would make this truly useful
3. What data needs to be tracked/logged
4. What reports/exports would be valuable
5. What future capabilities would be helpful
6. What projections/forecasts would be valuable based on historical data

Example: If user says "I need to calculate expenses"
- They need: Expense tracking GUI app
- Features: Add/edit/delete expenses, categories, dates, amounts, descriptions, tags
- Tracking: Full history, trends, patterns, spending by category, monthly/yearly summaries
- Projections: Future expense predictions based on history, budget forecasting
- Reports: Beautiful PDF/CSV exports with charts, graphs, summaries, visualizations
- Data: Persistent storage, search, filters, sorting, date ranges
- Visualizations: Charts showing spending trends, category breakdowns, time-series analysis

Return a JSON object with:
{
  "can_solve": true/false,
  "solution_type": "app" (99% of the time) | "script" (only for trivial tasks),
  "complexity": "medium" | "complex" (almost always),
  "description": "Detailed description of what the solution will do",
  "features": ["comprehensive", "list", "of", "all", "features", "needed"],
  "data_tracking": ["what", "data", "to", "track", "and", "log"],
  "projections": ["what", "projections", "or", "forecasts", "to", "include"],
  "exports": ["PDF", "CSV", "Excel", etc.],
  "visualizations": ["charts", "graphs", "to", "include"],
  "technologies": ["python", "tkinter" or "pyqt" or "web", etc.],
  "approach": "How to solve it with full feature set"
}"""

            user_prompt = f"""User problem: "{problem_description}"

User context: {json.dumps(user_context or {}, indent=2)}

Analyze this problem DEEPLY. Think about:
- What the user REALLY needs (infer ALL requirements - be smart!)
- What features would make this truly useful and complete
- What data needs tracking and full history logging
- What projections/forecasts would be valuable based on historical data
- What reports/exports would be valuable (PDF with charts, CSV with all data)
- What visualizations would help (charts, graphs, trends)
- What future capabilities would help

Remember: 99% preference for GUI applications. Only use scripts for trivial one-time tasks.

Be comprehensive - if they need expense tracking, they also need:
- History tracking
- Projections/forecasts
- Beautiful reports
- Data visualization
- Search and filters

Return the analysis JSON."""

            payload = {
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "stream": False
            }
            
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result.get("message", {}).get("content", "{}")
                
                # Try to extract JSON
                import re
                json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', content, re.DOTALL)
                if json_match:
                    analysis = json.loads(json_match.group())
                    return analysis
            
            # Fallback - default to GUI app
            return {
                "can_solve": True,
                "solution_type": "app",
                "complexity": "medium",
                "description": "A GUI application to solve your problem",
                "features": ["Data entry", "History tracking", "Reports"],
                "data_tracking": ["All relevant data"],
                "exports": ["PDF", "CSV"],
                "technologies": ["python", "tkinter"],
                "approach": "Create a GUI application with full features"
            }
    except Exception as e:
        print(f"Error analyzing problem: {e}")
        return {
            "can_solve": True,
            "solution_type": "script",
            "complexity": "simple",
            "description": "A solution to help with your problem",
            "technologies": ["python"],
            "approach": "Create a script to automate the task"
        }


async def generate_solution(problem_description: str, analysis: Dict, username: str, previous_solution_id: Optional[str] = None) -> Dict:
    """
    Generate a solution (script, app, etc.) based on the problem and analysis
    ALWAYS prefer GUI applications (99% preference)
    If previous_solution_id is provided, this is an iterative refinement
    """
    solutions_dir = get_user_solutions_dir(username)
    
    # If refining, use the existing solution directory, otherwise create new
    if previous_solution_id:
        solution_id = previous_solution_id
        solution_dir = solutions_dir / solution_id
        if not solution_dir.exists():
            solution_dir.mkdir(parents=True, exist_ok=True)
    else:
        solution_id = f"solution_{datetime.now().timestamp()}"
        solution_dir = solutions_dir / solution_id
        solution_dir.mkdir(parents=True, exist_ok=True)
    
    solution_type = analysis.get("solution_type", "app")  # Default to app
    complexity = analysis.get("complexity", "medium")
    
    # 99% preference for GUI applications
    if solution_type == "app" or complexity in ["medium", "complex"]:
        # Generate a full GUI application
        return await generate_app(problem_description, analysis, solution_dir, solution_id, previous_solution_id)
    else:
        # Only generate script for truly trivial tasks
        return await generate_script(problem_description, analysis, solution_dir, solution_id)


async def generate_script(problem_description: str, analysis: Dict, solution_dir: Path, solution_id: str) -> Dict:
    """Generate a Python or shell script"""
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            vision_statement = """MY PRIMARY JOB IS TO WRITE CODE & SERVE GOD, WHO IS NAMED JESUS CHRIST. AS I CHAT WITH MY USERS, MY GOAL IS TO WRITE CODE IN A WAY THAT IMPROVES THEIR LIFE. IF THEY ASK WHAT MY PURPOSE IS, MY PURPOSE IS TO SERVE JESUS BY MAKING LIFE BETTER. I WRITE CODE AND CREATE APPLICATIONS, AS WELL AS CONVERSE WITH THEM TO SOLVE PROBLEMS FROM A CHRISTIAN LENS, BECAUSE THAT IS THE ONLY WAY TO BEGIN AND END ALL THINGS WITH LOVE."""
            
            system_prompt = f"""{vision_statement}

You are an expert programmer. Your PRIMARY JOB is to WRITE CODE. Generate a complete, working script to solve the user's problem.

CRITICAL REQUIREMENTS - YOU MUST GENERATE WORKING CODE:
- The script must be complete and runnable immediately
- Include all necessary imports and dependencies
- Add comments explaining what it does
- Handle errors appropriately with try/except blocks
- Make it practical and useful
- Write production-ready code, not pseudocode
- Include proper error messages and validation

Return ONLY the code, no explanations, no markdown formatting, just the raw code that can be executed."""

            user_prompt = f"""Problem: {problem_description}

Analysis: {json.dumps(analysis, indent=2)}

Generate a complete script to solve this problem. Use Python unless the problem specifically requires shell scripting."""

            payload = {
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "stream": False
            }
            
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                code = result.get("message", {}).get("content", "")
                
                # Clean up code (remove markdown if present)
                if "```python" in code:
                    code = code.split("```python")[1].split("```")[0]
                elif "```bash" in code:
                    code = code.split("```bash")[1].split("```")[0]
                elif "```" in code:
                    code = code.split("```")[1].split("```")[0]
                
                # Determine file extension
                tech = analysis.get("technologies", ["python"])[0]
                if tech == "bash" or tech == "sh":
                    filename = "solution.sh"
                    filepath = solution_dir / filename
                    with open(filepath, 'w') as f:
                        f.write("#!/bin/bash\n\n")
                        f.write(code)
                    os.chmod(filepath, 0o755)
                else:
                    filename = "solution.py"
                    filepath = solution_dir / filename
                    with open(filepath, 'w') as f:
                        f.write(code)
                    os.chmod(filepath, 0o755)
                
                # Create metadata
                metadata = {
                    "solution_id": solution_id,
                    "problem": problem_description,
                    "type": "script",
                    "filename": filename,
                    "created_at": datetime.now().isoformat(),
                    "analysis": analysis
                }
                
                with open(solution_dir / "metadata.json", 'w') as f:
                    json.dump(metadata, f, indent=2)
                
                # Enhanced return for chat display
                return {
                    "success": True,
                    "solution_id": solution_id,
                    "type": "script",
                    "name": analysis.get("description", "Custom Script")[:50],
                    "description": analysis.get("description", "A script to solve your problem"),
                    "filepath": str(filepath),
                    "filename": filename,
                    "download_url": f"/api/solutions/{solution_id}/download",
                    "preview_url": f"/api/solutions/{solution_id}/preview",
                    "message": f"I've created a {filename} script to solve your problem. You can run it from: {filepath}",
                    "created_at": datetime.now().isoformat()
                }
    except Exception as e:
        print(f"Error generating script: {e}")
        return {
            "success": False,
            "message": f"Error generating solution: {str(e)}"
        }


async def generate_app(problem_description: str, analysis: Dict, solution_dir: Path, solution_id: str, previous_solution_id: Optional[str] = None) -> Dict:
    """
    Generate a full GUI application with all necessary features
    If previous_solution_id is provided, this is an iterative refinement
    """
    try:
        # Check if this is a refinement of an existing solution
        is_refinement = previous_solution_id is not None
        timeout = 180.0 if is_refinement else 300.0  # Faster for refinements
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            vision_statement = """MY PRIMARY JOB IS TO WRITE CODE & SERVE GOD, WHO IS NAMED JESUS CHRIST. AS I CHAT WITH MY USERS, MY GOAL IS TO WRITE CODE IN A WAY THAT IMPROVES THEIR LIFE. IF THEY ASK WHAT MY PURPOSE IS, MY PURPOSE IS TO SERVE JESUS BY MAKING LIFE BETTER. I WRITE CODE AND CREATE APPLICATIONS, AS WELL AS CONVERSE WITH THEM TO SOLVE PROBLEMS FROM A CHRISTIAN LENS, BECAUSE THAT IS THE ONLY WAY TO BEGIN AND END ALL THINGS WITH LOVE."""
            
            refinement_context = ""
            if is_refinement:
                refinement_context = f"""
IMPORTANT: This is a REFINEMENT of an existing solution. The user provided feedback: "{problem_description}"
- Keep the existing structure and features that work
- Add/modify only what the user requested
- Don't rebuild everything - just iterate on what needs to change
- Make it FAST - focus on the specific changes requested
"""
            
            system_prompt = f"""{vision_statement}

You are an expert full-stack developer. Your PRIMARY JOB is to WRITE CODE and BUILD APPLICATIONS. Generate a COMPLETE, PRODUCTION-READY GUI application that actually works.

{refinement_context}

CRITICAL REQUIREMENTS - YOU MUST GENERATE WORKING CODE IMMEDIATELY:
1. START CODING IMMEDIATELY - don't over-analyze, just build
2. MUST be a GUI application (tkinter, PyQt, or web-based with beautiful UI)
3. Include core features first, then add more based on user feedback
4. MUST have data persistence (database or file storage)
5. MUST have full history logging and tracking
6. MUST have beautiful PDF and CSV export capabilities
7. Include data visualization (charts, graphs) where appropriate
8. Include search, filter, and sorting capabilities
9. Make it beautiful, professional, and easy to use
10. Generate COMPLETE, RUNNABLE CODE - not pseudocode or placeholders
11. Include ALL necessary imports, error handling, and validation
12. Write code that can be executed immediately - production-ready quality
13. If this is a refinement, make ONLY the requested changes - don't rebuild everything

For example, if user needs "expense calculator":
- GUI with forms to add/edit expenses
- Categories, dates, amounts, descriptions
- Full history with search/filter
- Charts showing trends
- Projections based on historical data
- Beautiful PDF reports with charts
- CSV export with all data
- Data validation and error handling

Return a JSON object with:
{
  "backend": "Python backend code (FastAPI if web, or main.py if desktop)",
  "frontend": "GUI code (tkinter/PyQt for desktop, HTML/React for web)",
  "database": "database schema or data model",
  "exports": "PDF and CSV export code",
  "config": "configuration files",
  "readme": "complete setup instructions",
  "dependencies": ["all", "required", "packages"],
  "features": ["list", "of", "all", "features", "implemented"]
}

Make it COMPLETE and PRODUCTION-READY."""

            user_prompt = f"""Problem: {problem_description}

Analysis: {json.dumps(analysis, indent=2)}

{"REFINEMENT REQUEST: The user wants changes to an existing solution. Make ONLY the requested changes." if is_refinement else "Generate a COMPLETE GUI application. Start with core features - we'll iterate based on user feedback:"}

Core Features (start with these):
- Beautiful, intuitive GUI
- Data entry and management
- Full history tracking and logging
- Search, filter, and sort capabilities
- Data visualization (charts/graphs)
- Beautiful PDF export with charts and formatting
- CSV export with all data
- Data persistence (database or file storage)
- Error handling and validation

{"Focus on the specific changes requested. Keep existing features that work." if is_refinement else "Start with these core features - we can add more based on user feedback."}

Generate COMPLETE, PRODUCTION-READY code NOW - don't wait, just build."""

            payload = {
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "stream": False
            }
            
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result.get("message", {}).get("content", "{}")
                
                # Try to extract JSON
                import re
                json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', content, re.DOTALL)
                if json_match:
                    app_data = json.loads(json_match.group())
                    
                    # Create backend/main application
                    if "backend" in app_data:
                        backend_dir = solution_dir / "backend"
                        backend_dir.mkdir(exist_ok=True)
                        with open(backend_dir / "main.py", 'w', encoding='utf-8') as f:
                            f.write(app_data["backend"])
                    
                    # Create frontend/GUI
                    if "frontend" in app_data:
                        frontend_dir = solution_dir / "frontend"
                        frontend_dir.mkdir(exist_ok=True)
                        # Determine if it's HTML or Python GUI
                        if "tkinter" in app_data.get("frontend", "").lower() or "PyQt" in app_data.get("frontend", "").lower():
                            # Python GUI - add to main.py or separate file
                            with open(solution_dir / "gui.py", 'w', encoding='utf-8') as f:
                                f.write(app_data["frontend"])
                        else:
                            # Web frontend
                            with open(frontend_dir / "index.html", 'w', encoding='utf-8') as f:
                                f.write(app_data["frontend"])
                    
                    # Create database/data model
                    if "database" in app_data:
                        with open(solution_dir / "database.py", 'w', encoding='utf-8') as f:
                            f.write(app_data["database"])
                    
                    # Create export modules
                    if "exports" in app_data:
                        with open(solution_dir / "exports.py", 'w', encoding='utf-8') as f:
                            f.write(app_data["exports"])
                    
                    # Create README
                    if "readme" in app_data:
                        with open(solution_dir / "README.md", 'w', encoding='utf-8') as f:
                            f.write(app_data["readme"])
                    
                    # Create requirements.txt with essential libraries
                    essential_deps = [
                        "reportlab>=4.0.0",  # PDF generation
                        "matplotlib>=3.7.0",  # Charts and graphs
                        "pandas>=2.0.0",  # Data manipulation
                        "openpyxl>=3.1.0",  # Excel/CSV handling
                    ]
                    
                    if "dependencies" in app_data:
                        deps = app_data["dependencies"]
                        if isinstance(deps, list):
                            all_deps = essential_deps + deps
                        else:
                            all_deps = essential_deps + [deps]
                    else:
                        all_deps = essential_deps
                    
                    # Add GUI framework if not specified
                    if "tkinter" not in str(app_data.get("frontend", "")).lower() and "PyQt" not in str(app_data.get("frontend", "")).lower():
                        all_deps.append("tkinter")  # Usually built-in, but good to note
                    
                    with open(solution_dir / "requirements.txt", 'w', encoding='utf-8') as f:
                        f.write("\n".join(set(all_deps)))  # Remove duplicates
                    
                    # Create run script
                    run_script = """#!/bin/bash
# Run the application
cd "$(dirname "$0")"
python3 main.py
"""
                    with open(solution_dir / "run.sh", 'w') as f:
                        f.write(run_script)
                    os.chmod(solution_dir / "run.sh", 0o755)
                    
                    # Create metadata
                    metadata = {
                        "solution_id": solution_id,
                        "problem": problem_description,
                        "type": "app",
                        "created_at": datetime.now().isoformat(),
                        "analysis": analysis,
                        "features": app_data.get("features", analysis.get("features", [])),
                        "has_gui": True,
                        "has_exports": True,
                        "has_tracking": True
                    }
                    
                    with open(solution_dir / "metadata.json", 'w', encoding='utf-8') as f:
                        json.dump(metadata, f, indent=2)
                    
                    features_list = ", ".join(metadata.get("features", [])[:5])
                    
                    # Enhanced return for chat display
                    return {
                        "success": True,
                        "solution_id": solution_id,
                        "type": "app",
                        "name": analysis.get("description", "Custom Application")[:50],  # App name
                        "description": analysis.get("description", "A GUI application to solve your problem"),
                        "filepath": str(solution_dir),
                        "download_url": f"/api/solutions/{solution_id}/download",  # For chat download button
                        "preview_url": f"/api/solutions/{solution_id}/preview",  # For chat preview
                        "features": metadata.get("features", analysis.get("features", [])),
                        "message": f"I've created a complete GUI application with {features_list}. The app includes data tracking, history logging, charts, and beautiful PDF/CSV exports. Files are in: {solution_dir}",
                        # Additional metadata for chat display
                        "has_gui": metadata.get("has_gui", True),
                        "has_exports": metadata.get("has_exports", True),
                        "has_tracking": metadata.get("has_tracking", True),
                        "created_at": metadata.get("created_at")
                    }
    except Exception as e:
        print(f"Error generating app: {e}")
        return {
            "success": False,
            "message": f"Error generating application: {str(e)}"
        }


def list_user_solutions(username: str) -> List[Dict]:
    """List all solutions created for a user"""
    solutions_dir = get_user_solutions_dir(username)
    solutions = []
    
    if not solutions_dir.exists():
        return solutions
    
    for solution_dir in solutions_dir.iterdir():
        if solution_dir.is_dir():
            metadata_file = solution_dir / "metadata.json"
            if metadata_file.exists():
                try:
                    with open(metadata_file, 'r') as f:
                        metadata = json.load(f)
                        # Enhance metadata with chat display info
                        metadata["download_url"] = f"/api/solutions/{metadata.get('solution_id')}/download"
                        metadata["preview_url"] = f"/api/solutions/{metadata.get('solution_id')}/preview"
                        solutions.append(metadata)
                except Exception:
                    pass
    
    return sorted(solutions, key=lambda x: x.get("created_at", ""), reverse=True)

def get_proactive_app_suggestion(username: str, problem_keyword: str) -> Optional[Dict]:
    """
    Generate proactive app suggestion based on detected problem pattern
    Returns suggestion for chat display
    """
    try:
        # Check if user already has a solution for this problem
        existing_solutions = list_user_solutions(username)
        for solution in existing_solutions:
            problem = solution.get("problem", "").lower()
            if problem_keyword.lower() in problem:
                # User already has a solution for this
                return None
        
        # Generate suggestion
        return {
            "suggestion_id": f"app_suggestion_{datetime.now().timestamp()}",
            "type": "app_suggestion",
            "title": f"I noticed you mention '{problem_keyword}' often",
            "message": f"Would you like me to create a custom application to help with {problem_keyword}?",
            "action": "create_app",
            "action_data": {
                "problem": problem_keyword
            },
            "confidence": 0.8,
            "created_at": datetime.now().isoformat()
        }
    except Exception:
        return None

