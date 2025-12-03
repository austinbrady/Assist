#!/usr/bin/env python3
"""
App Analysis Tool
Analyzes existing AI assistant apps and extracts their architecture,
authentication methods, and API endpoints to help integrate them
into the unified AssisantAI infrastructure.
"""

import os
import json
import sys
import argparse
from pathlib import Path
from typing import Dict, List, Any
import re

class AppAnalyzer:
    def __init__(self, app_path: str):
        self.app_path = Path(app_path)
        self.analysis = {
            "name": self.app_path.name,
            "path": str(self.app_path),
            "type": None,
            "framework": None,
            "auth": {},
            "apis": [],
            "database": {},
            "agent_integration": {},
            "dependencies": {},
            "config_files": []
        }
    
    def analyze(self) -> Dict[str, Any]:
        """Main analysis function"""
        print(f"Analyzing app: {self.app_path.name}")
        
        if not self.app_path.exists():
            print(f"Error: Path {self.app_path} does not exist")
            return self.analysis
        
        # Detect framework
        self._detect_framework()
        
        # Analyze authentication
        self._analyze_auth()
        
        # Analyze APIs
        self._analyze_apis()
        
        # Analyze database
        self._analyze_database()
        
        # Analyze agent integration
        self._analyze_agent_integration()
        
        # Analyze dependencies
        self._analyze_dependencies()
        
        # Find config files
        self._find_config_files()
        
        return self.analysis
    
    def _detect_framework(self):
        """Detect the framework/technology stack"""
        if (self.app_path / "package.json").exists():
            self.analysis["type"] = "nodejs"
            try:
                with open(self.app_path / "package.json") as f:
                    pkg = json.load(f)
                    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
                    
                    if "next" in deps:
                        self.analysis["framework"] = "nextjs"
                    elif "react" in deps:
                        self.analysis["framework"] = "react"
                    elif "express" in deps:
                        self.analysis["framework"] = "express"
                    elif "fastify" in deps:
                        self.analysis["framework"] = "fastify"
                    else:
                        self.analysis["framework"] = "nodejs"
            except:
                self.analysis["framework"] = "nodejs"
        
        elif (self.app_path / "requirements.txt").exists():
            self.analysis["type"] = "python"
            try:
                with open(self.app_path / "requirements.txt") as f:
                    content = f.read()
                    if "flask" in content:
                        self.analysis["framework"] = "flask"
                    elif "django" in content:
                        self.analysis["framework"] = "django"
                    elif "fastapi" in content:
                        self.analysis["framework"] = "fastapi"
                    else:
                        self.analysis["framework"] = "python"
            except:
                self.analysis["framework"] = "python"
        
        elif (self.app_path / "go.mod").exists():
            self.analysis["type"] = "go"
            self.analysis["framework"] = "go"
        
        else:
            self.analysis["type"] = "unknown"
            self.analysis["framework"] = "unknown"
    
    def _analyze_auth(self):
        """Analyze authentication implementation"""
        auth_files = [
            "auth.js", "auth.ts", "auth.py", "authentication.js",
            "middleware/auth.js", "lib/auth.js", "utils/auth.js",
            "auth/", "authentication/"
        ]
        
        for auth_file in auth_files:
            auth_path = self.app_path / auth_file
            if auth_path.exists():
                if auth_path.is_file():
                    self._extract_auth_from_file(auth_path)
                elif auth_path.is_dir():
                    for file in auth_path.rglob("*.{js,ts,py}"):
                        self._extract_auth_from_file(file)
                break
        
        # Search for auth patterns in code
        self._search_auth_patterns()
    
    def _extract_auth_from_file(self, file_path: Path):
        """Extract authentication logic from a file"""
        try:
            content = file_path.read_text()
            
            # Detect JWT
            if "jwt" in content.lower() or "jsonwebtoken" in content:
                self.analysis["auth"]["type"] = "jwt"
            
            # Detect OAuth
            if "oauth" in content.lower() or "passport" in content:
                self.analysis["auth"]["type"] = "oauth"
            
            # Detect session-based
            if "session" in content.lower() and "cookie" in content.lower():
                self.analysis["auth"]["type"] = "session"
            
            # Find auth endpoints
            auth_endpoints = re.findall(r'["\'](/[^"\']*auth[^"\']*)["\']', content, re.IGNORECASE)
            if auth_endpoints:
                self.analysis["auth"]["endpoints"] = list(set(auth_endpoints))
        
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
    
    def _search_auth_patterns(self):
        """Search for authentication patterns in codebase"""
        patterns = {
            "jwt": r"jwt|jsonwebtoken|token",
            "oauth": r"oauth|passport",
            "session": r"session|cookie",
            "firebase": r"firebase.*auth",
            "supabase": r"supabase.*auth"
        }
        
        for auth_type, pattern in patterns.items():
            for file in self.app_path.rglob("*.{js,ts,py}"):
                try:
                    if re.search(pattern, file.read_text(), re.IGNORECASE):
                        if "type" not in self.analysis["auth"]:
                            self.analysis["auth"]["type"] = auth_type
                except:
                    pass
    
    def _analyze_apis(self):
        """Analyze API endpoints"""
        api_files = [
            "api/", "routes/", "endpoints/", "controllers/",
            "app.js", "server.js", "main.py", "app.py"
        ]
        
        for api_path in api_files:
            full_path = self.app_path / api_path
            if full_path.exists():
                if full_path.is_dir():
                    for file in full_path.rglob("*.{js,ts,py}"):
                        self._extract_apis_from_file(file)
                else:
                    self._extract_apis_from_file(full_path)
    
    def _extract_apis_from_file(self, file_path: Path):
        """Extract API endpoints from a file"""
        try:
            content = file_path.read_text()
            
            # Express.js routes
            routes = re.findall(r'\.(get|post|put|delete|patch)\(["\']([^"\']+)["\']', content)
            for method, path in routes:
                self.analysis["apis"].append({
                    "method": method.upper(),
                    "path": path,
                    "file": str(file_path.relative_to(self.app_path))
                })
            
            # FastAPI routes
            routes = re.findall(r'@app\.(get|post|put|delete|patch)\(["\']([^"\']+)["\']', content)
            for method, path in routes:
                self.analysis["apis"].append({
                    "method": method.upper(),
                    "path": path,
                    "file": str(file_path.relative_to(self.app_path))
                })
            
            # Flask routes
            routes = re.findall(r'@app\.route\(["\']([^"\']+)["\']', content)
            for path in routes:
                self.analysis["apis"].append({
                    "method": "GET",
                    "path": path,
                    "file": str(file_path.relative_to(self.app_path))
                })
        
        except Exception as e:
            print(f"Error analyzing APIs in {file_path}: {e}")
    
    def _analyze_database(self):
        """Analyze database configuration"""
        config_files = [
            "config.js", "config.ts", "config.py", ".env",
            "database.js", "db.js", "prisma/schema.prisma"
        ]
        
        for config_file in config_files:
            config_path = self.app_path / config_file
            if config_path.exists():
                try:
                    content = config_path.read_text()
                    
                    # Detect database types
                    if "mongodb" in content.lower() or "mongoose" in content:
                        self.analysis["database"]["type"] = "mongodb"
                    elif "postgres" in content.lower() or "pg" in content:
                        self.analysis["database"]["type"] = "postgresql"
                    elif "mysql" in content.lower():
                        self.analysis["database"]["type"] = "mysql"
                    elif "sqlite" in content.lower():
                        self.analysis["database"]["type"] = "sqlite"
                    elif "prisma" in content.lower():
                        self.analysis["database"]["type"] = "prisma"
                
                except:
                    pass
    
    def _analyze_agent_integration(self):
        """Analyze how the app integrates with AI agents"""
        agent_files = [
            "agent/", "ai/", "assistant/", "chat/",
            "openai", "anthropic", "claude", "gpt"
        ]
        
        for agent_path in agent_files:
            full_path = self.app_path / agent_path
            if full_path.exists():
                if full_path.is_dir():
                    for file in full_path.rglob("*.{js,ts,py}"):
                        self._extract_agent_info(file)
                else:
                    self._extract_agent_info(full_path)
        
        # Search for AI provider patterns
        for file in self.app_path.rglob("*.{js,ts,py}"):
            try:
                content = file.read_text()
                if "openai" in content.lower():
                    self.analysis["agent_integration"]["provider"] = "openai"
                elif "anthropic" in content.lower() or "claude" in content.lower():
                    self.analysis["agent_integration"]["provider"] = "anthropic"
            except:
                pass
    
    def _extract_agent_info(self, file_path: Path):
        """Extract agent integration information"""
        try:
            content = file_path.read_text()
            # Extract API keys, model names, etc.
            models = re.findall(r'model["\']?\s*[:=]\s*["\']([^"\']+)["\']', content, re.IGNORECASE)
            if models:
                self.analysis["agent_integration"]["models"] = list(set(models))
        except:
            pass
    
    def _analyze_dependencies(self):
        """Analyze project dependencies"""
        if self.analysis["type"] == "nodejs":
            pkg_path = self.app_path / "package.json"
            if pkg_path.exists():
                try:
                    with open(pkg_path) as f:
                        pkg = json.load(f)
                        self.analysis["dependencies"] = {
                            **pkg.get("dependencies", {}),
                            **pkg.get("devDependencies", {})
                        }
                except:
                    pass
        
        elif self.analysis["type"] == "python":
            req_path = self.app_path / "requirements.txt"
            if req_path.exists():
                try:
                    deps = []
                    with open(req_path) as f:
                        for line in f:
                            line = line.strip()
                            if line and not line.startswith("#"):
                                deps.append(line.split("==")[0].split(">=")[0].split("<=")[0])
                    self.analysis["dependencies"] = deps
                except:
                    pass
    
    def _find_config_files(self):
        """Find configuration files"""
        config_patterns = [
            "*.config.js", "*.config.ts", ".env*", "config.json",
            "settings.json", "config.yaml", "config.yml"
        ]
        
        for pattern in config_patterns:
            for file in self.app_path.rglob(pattern):
                if file.is_file():
                    self.analysis["config_files"].append(str(file.relative_to(self.app_path)))


def generate_integration_guide(analyses: List[Dict[str, Any]], output_path: Path):
    """Generate integration guide based on analyses"""
    guide = {
        "summary": "Integration Guide for AssisantAI",
        "apps": analyses,
        "recommendations": {
            "auth_migration": [],
            "api_migration": [],
            "database_migration": [],
            "agent_migration": []
        },
        "middleware_endpoints": [],
        "steps": []
    }
    
    # Generate recommendations
    for analysis in analyses:
        app_name = analysis["name"]
        
        # Auth migration recommendations
        if analysis.get("auth", {}).get("type"):
            guide["recommendations"]["auth_migration"].append({
                "app": app_name,
                "current": analysis["auth"]["type"],
                "target": "PersonalAI unified auth",
                "steps": [
                    f"Replace {app_name} auth with PersonalAI auth middleware",
                    "Update login/logout endpoints to use /api/auth/*",
                    "Migrate user sessions to PersonalAI session store"
                ]
            })
        
        # API migration recommendations
        if analysis.get("apis"):
            guide["recommendations"]["api_migration"].append({
                "app": app_name,
                "endpoints": len(analysis["apis"]),
                "steps": [
                    f"Proxy {app_name} APIs through middleware",
                    "Add authentication middleware to all endpoints",
                    "Update CORS to allow middleware access"
                ]
            })
    
    # Save guide
    with open(output_path, "w") as f:
        json.dump(guide, f, indent=2)
    
    print(f"\nIntegration guide saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Analyze AI assistant apps for integration")
    parser.add_argument("--app1", required=True, help="Path to first app")
    parser.add_argument("--app2", required=True, help="Path to second app")
    parser.add_argument("--output", default="analysis_results.json", help="Output file for analysis")
    parser.add_argument("--guide", default="integration_guide.json", help="Output file for integration guide")
    
    args = parser.parse_args()
    
    # Analyze both apps
    analyses = []
    for app_path in [args.app1, args.app2]:
        analyzer = AppAnalyzer(app_path)
        analysis = analyzer.analyze()
        analyses.append(analysis)
    
    # Save analyses
    output_path = Path(args.output)
    with open(output_path, "w") as f:
        json.dump(analyses, f, indent=2)
    
    print(f"\nAnalysis complete! Results saved to: {output_path}")
    
    # Generate integration guide
    guide_path = Path(args.guide)
    generate_integration_guide(analyses, guide_path)
    
    # Print summary
    print("\n" + "="*60)
    print("ANALYSIS SUMMARY")
    print("="*60)
    for analysis in analyses:
        print(f"\nApp: {analysis['name']}")
        print(f"  Type: {analysis['type']} ({analysis['framework']})")
        print(f"  Auth: {analysis.get('auth', {}).get('type', 'Not detected')}")
        print(f"  APIs: {len(analysis.get('apis', []))} endpoints found")
        print(f"  Database: {analysis.get('database', {}).get('type', 'Not detected')}")
    print("\n" + "="*60)


if __name__ == "__main__":
    main()

