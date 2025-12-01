#!/usr/bin/env python3
"""
Personal AI - CLI Launcher (Fallback when GUI fails)
Displays IP address and localhost, runs servers
"""

import subprocess
import socket
import time
import sys
import os
from pathlib import Path

def get_network_ip():
    """Get local network IP address"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def check_server(port, name):
    """Check if a server is running on a port"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result == 0
    except:
        return False

def check_ollama():
    """Check if Ollama is running"""
    return check_server(11434, "Ollama")

def open_terminal_and_run(title, command, cwd=None):
    """Opens a new Terminal window and runs a command in it."""
    if sys.platform == "darwin":
        # Create a temporary shell script to avoid AppleScript escaping issues
        import tempfile
        import stat
        
        # Create temp script file
        script_content = "#!/bin/bash\n"
        if cwd:
            script_content += f"cd {repr(str(cwd))}\n"
        script_content += f"{command}\n"
        script_content += "echo \"\nPress any key to close this window...\"\n"
        script_content += "read -n 1\n"
        
        # Write to temp file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.sh', delete=False) as f:
            f.write(script_content)
            script_path = f.name
        
        # Make executable
        os.chmod(script_path, stat.S_IRWXU | stat.S_IRGRP | stat.S_IROTH)
        
        # Use AppleScript to open Terminal with the script
        # This avoids all escaping issues
        osascript_cmd = f'''tell application "Terminal"
    activate
    do script "bash {script_path}"
    set custom title of front tab of front window to "{title}"
end tell'''
        
        subprocess.Popen(["osascript", "-e", osascript_cmd])
    else:
        if cwd:
            subprocess.Popen(command, shell=True, cwd=cwd)
        else:
            subprocess.Popen(command, shell=True)

def main():
    project_dir = Path(__file__).parent.absolute()
    network_ip = get_network_ip()
    
    print("=" * 60)
    print("  Personal AI - CLI Launcher")
    print("=" * 60)
    print()
    print("Access URLs:")
    print(f"  Local:   http://localhost:7777")
    print(f"  Network: http://{network_ip}:7777")
    print()
    
    # Check current server status
    ollama_running = check_ollama()
    backend_running = check_server(8000, "Backend")
    frontend_running = check_server(7777, "Frontend")
    
    print("Server Status:")
    print(f"  Ollama:  {'✅ Running' if ollama_running else '❌ Stopped'}")
    print(f"  Backend:  {'✅ Running' if backend_running else '❌ Stopped'}")
    print(f"  Frontend: {'✅ Running' if frontend_running else '❌ Stopped'}")
    print()
    
    # Start servers in order: Ollama first, then backend, then frontend
    if not ollama_running or not backend_running or not frontend_running:
        print("Starting servers...")
        print()
        
        # Start Ollama first (required for backend)
        if not ollama_running:
            print("Starting Ollama...")
            open_terminal_and_run("Personal AI - Ollama", "ollama serve", None)
            print("✅ Ollama server starting in Terminal window")
            time.sleep(3)  # Give Ollama a moment to start
        
        # Start backend
        if not backend_running:
            backend_cmd = f"source venv/bin/activate && python main.py"
            open_terminal_and_run("Personal AI - Backend", backend_cmd, project_dir / "backend")
            print("✅ Backend server starting in Terminal window")
            time.sleep(2)
        
        # Start frontend
        if not frontend_running:
            frontend_cmd = "npm run dev"
            open_terminal_and_run("Personal AI - Frontend", frontend_cmd, project_dir / "frontend")
            print("✅ Frontend server starting in Terminal window")
            time.sleep(2)
        
        print()
        print("Waiting for servers to start...")
        print("(This may take 10-20 seconds)")
        print()
        
        # Wait and check
        for i in range(30):  # Increased timeout for Ollama
            time.sleep(1)
            ollama_running = check_ollama()
            backend_running = check_server(8000, "Backend")
            frontend_running = check_server(7777, "Frontend")
            if ollama_running and backend_running and frontend_running:
                print()
                print("✅ All servers are running!")
                break
            print(".", end="", flush=True)
        
        print()
        print()
    
    print("=" * 60)
    print("Servers are ready!")
    print()
    print("Access Personal AI:")
    print(f"  http://localhost:7777")
    print(f"  http://{network_ip}:7777")
    print()
    print("=" * 60)
    print()
    print("✅ Launcher complete. Servers are running in separate Terminal windows.")
    print("   Close those Terminal windows to stop the servers.")
    print("   This window will close in 3 seconds...")
    print()
    
    # Give user time to read the message, then exit
    time.sleep(3)

if __name__ == "__main__":
    main()

