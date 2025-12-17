#!/usr/bin/env python3
"""
Personal AI - Simple GUI Launcher
Displays IP address and localhost, runs servers in terminal
"""

import sys
import os

# Set environment variable before importing tkinter to bypass version checks
os.environ['TK_SILENCE_DEPRECATION'] = '1'

import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import subprocess
import threading
import time
import socket
import webbrowser
from pathlib import Path

try:
    import requests
except ImportError:
    requests = None

class PersonalAILauncher:
    def __init__(self, root):
        self.root = root
        self.root.title("Personal AI")
        self.root.geometry("600x550")
        self.root.resizable(False, False)
        
        # Get project directory
        self.project_dir = Path(__file__).parent.absolute()
        
        # Server processes
        self.backend_process = None
        self.frontend_process = None
        self.backend_running = False
        self.frontend_running = False
        
        # Update checking
        self.update_available = False
        self.current_version = "1.0.0"  # You can read this from a file
        self.latest_version = None
        
        # Get network IP
        self.network_ip = self.get_network_ip()
        
        self.setup_ui()
        self.check_servers()
        self.check_for_updates()
        
    def get_network_ip(self):
        """Get local network IP address"""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "Unable to detect"
    
    def setup_ui(self):
        # Header frame with update indicator
        header_frame = tk.Frame(self.root, bg="white")
        header_frame.pack(fill=tk.X, pady=20)
        
        # Update indicator (blue neon light) - hidden by default
        self.update_indicator = tk.Label(
            header_frame,
            text="●",
            font=("SF Pro Display", 20),
            fg="#00FFFF",
            bg="white"
        )
        self.update_indicator.pack(side=tk.LEFT, padx=20)
        self.update_indicator.pack_forget()  # Hide initially
        
        # Header
        header = tk.Label(
            header_frame,
            text="Personal AI",
            font=("SF Pro Display", 24, "bold"),
            fg="#1d1d1f",
            bg="white"
        )
        header.pack(side=tk.LEFT)
        
        # Update button (hidden by default)
        self.update_button = tk.Button(
            header_frame,
            text="Update Available",
            font=("SF Pro Text", 10, "bold"),
            bg="#00FFFF",
            fg="#1d1d1f",
            relief=tk.FLAT,
            padx=10,
            pady=5,
            command=self.download_update,
            cursor="hand2"
        )
        self.update_button.pack(side=tk.RIGHT, padx=20)
        self.update_button.pack_forget()  # Hide initially
        
        # Status frame
        status_frame = tk.Frame(self.root, bg="#f5f5f7", relief=tk.FLAT)
        status_frame.pack(fill=tk.X, padx=20, pady=10)
        
        # Backend status
        self.backend_status = tk.Label(
            status_frame,
            text="Backend: Stopped",
            font=("SF Pro Text", 12),
            bg="#f5f5f7",
            fg="#86868b"
        )
        self.backend_status.pack(anchor=tk.W, padx=15, pady=5)
        
        # Frontend status
        self.frontend_status = tk.Label(
            status_frame,
            text="Frontend: Stopped",
            font=("SF Pro Text", 12),
            bg="#f5f5f7",
            fg="#86868b"
        )
        self.frontend_status.pack(anchor=tk.W, padx=15, pady=5)
        
        # Access URLs frame
        urls_frame = tk.Frame(self.root)
        urls_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        # Local URL
        local_frame = tk.Frame(urls_frame, bg="#007AFF", relief=tk.FLAT)
        local_frame.pack(fill=tk.X, pady=5)
        
        local_label = tk.Label(
            local_frame,
            text="Local Access",
            font=("SF Pro Text", 10),
            bg="#007AFF",
            fg="white"
        )
        local_label.pack(anchor=tk.W, padx=15, pady=(10, 5))
        
        self.local_url = tk.Label(
            local_frame,
            text="http://localhost:7777",
            font=("Monaco", 14, "bold"),
            bg="#007AFF",
            fg="white",
            cursor="hand2"
        )
        self.local_url.pack(anchor=tk.W, padx=15, pady=(0, 10))
        self.local_url.bind("<Button-1>", lambda e: webbrowser.open("http://localhost:7777"))
        
        # Network URL
        network_frame = tk.Frame(urls_frame, bg="#5856D6", relief=tk.FLAT)
        network_frame.pack(fill=tk.X, pady=5)
        
        network_label = tk.Label(
            network_frame,
            text="Network Access",
            font=("SF Pro Text", 10),
            bg="#5856D6",
            fg="white"
        )
        network_label.pack(anchor=tk.W, padx=15, pady=(10, 5))
        
        network_url_text = f"http://{self.network_ip}:7777"
        self.network_url = tk.Label(
            network_frame,
            text=network_url_text,
            font=("Monaco", 14, "bold"),
            bg="#5856D6",
            fg="white",
            cursor="hand2"
        )
        self.network_url.pack(anchor=tk.W, padx=15, pady=(0, 10))
        self.network_url.bind("<Button-1>", lambda e: webbrowser.open(network_url_text))
        
        # Toggle switch frame
        toggle_frame = tk.Frame(self.root, bg="white")
        toggle_frame.pack(fill=tk.X, padx=20, pady=15)
        
        # Toggle label
        toggle_label = tk.Label(
            toggle_frame,
            text="AI Servers",
            font=("SF Pro Text", 16, "bold"),
            bg="white",
            fg="#1d1d1f"
        )
        toggle_label.pack(side=tk.LEFT, padx=(0, 15))
        
        # Toggle switch (custom button that looks like a switch)
        self.toggle_state = False
        self.toggle_button = tk.Button(
            toggle_frame,
            text="OFF",
            font=("SF Pro Text", 12, "bold"),
            bg="#e5e5ea",
            fg="#86868b",
            relief=tk.FLAT,
            width=8,
            height=2,
            command=self.toggle_servers,
            cursor="hand2"
        )
        self.toggle_button.pack(side=tk.LEFT)
        
        # Buttons frame
        buttons_frame = tk.Frame(self.root)
        buttons_frame.pack(fill=tk.X, padx=20, pady=10)
        
        # Open browser button
        open_button = tk.Button(
            buttons_frame,
            text="Open App",
            font=("SF Pro Text", 14, "bold"),
            bg="#007AFF",
            fg="white",
            relief=tk.FLAT,
            padx=20,
            pady=10,
            command=lambda: webbrowser.open("http://localhost:7777"),
            cursor="hand2"
        )
        open_button.pack(fill=tk.X)
        
        # Initialize toggle state
        self.toggle_state = False
        self.update_toggle_display()
        
        # Initialize toggle state
        self.toggle_state = False
        self.update_toggle_display()
        
        # Start checking server status
        self.update_status()
    
    def check_servers(self):
        """Check if servers are already running"""
        if requests:
            try:
                response = requests.get("http://localhost:8000/health", timeout=1)
                if response.status_code == 200:
                    self.backend_running = True
            except:
                self.backend_running = False
            
            try:
                response = requests.get("http://localhost:7777", timeout=1)
                if response.status_code == 200:
                    self.frontend_running = True
            except:
                self.frontend_running = False
        else:
            # Fallback: use socket to check if ports are open
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex(('localhost', 8000))
                sock.close()
                self.backend_running = (result == 0)
            except:
                self.backend_running = False
            
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex(('localhost', 7777))
                sock.close()
                self.frontend_running = (result == 0)
            except:
                self.frontend_running = False
        
        # Update toggle state
        if self.backend_running or self.frontend_running:
            self.toggle_state = True
        else:
            self.toggle_state = False
        self.update_toggle_display()
    
    def toggle_servers(self):
        """Toggle servers on/off"""
        if self.toggle_state:
            self.stop_servers()
        else:
            self.start_servers()
    
    def update_toggle_display(self):
        """Update toggle switch appearance"""
        if self.toggle_state:
            self.toggle_button.config(
                text="ON",
                bg="#34c759",
                fg="white"
            )
        else:
            self.toggle_button.config(
                text="OFF",
                bg="#e5e5ea",
                fg="#86868b"
            )
    
    def start_servers(self):
        """Start backend and frontend servers"""
        # Check dependencies
        if not (self.project_dir / "backend" / "venv").exists():
            messagebox.showerror(
                "Missing Dependencies",
                "Please run ./INSTALL.sh first to install dependencies."
            )
            self.toggle_state = False
            self.update_toggle_display()
            return
        
        self.toggle_state = True
        self.update_toggle_display()
        
        # Start backend in terminal
        backend_dir = self.project_dir / "backend"
        backend_script = f"cd '{backend_dir}' && source venv/bin/activate && python main.py"
        
        if os.name == 'nt':  # Windows
            subprocess.Popen(
                ["start", "cmd", "/k", backend_script],
                shell=True,
                cwd=str(backend_dir)
            )
        else:  # macOS/Linux
            # Escape path for AppleScript
            escaped_dir = str(backend_dir).replace("'", "'\"'\"'")
            osascript_cmd = f'''
tell application "Terminal"
    activate
    do script "cd '{escaped_dir}' && source venv/bin/activate && python main.py"
end tell
'''
            subprocess.Popen(
                ["osascript", "-e", osascript_cmd],
                cwd=str(backend_dir)
            )
        
        time.sleep(2)
        
        # Start frontend in terminal
        frontend_dir = self.project_dir / "frontend"
        
        if os.name == 'nt':  # Windows
            subprocess.Popen(
                ["start", "cmd", "/k", "npm run dev"],
                shell=True,
                cwd=str(frontend_dir)
            )
        else:  # macOS/Linux
            # Escape path for AppleScript
            escaped_dir = str(frontend_dir).replace("'", "'\"'\"'")
            osascript_cmd = f'''
tell application "Terminal"
    activate
    do script "cd '{escaped_dir}' && npm run dev"
end tell
'''
            subprocess.Popen(
                ["osascript", "-e", osascript_cmd],
                cwd=str(frontend_dir)
            )
        
        # Open browser after a delay
        self.root.after(5000, lambda: webbrowser.open("http://localhost:7777"))
    
    def stop_servers(self):
        """Stop backend and frontend servers"""
        # Kill processes on ports
        if os.name != 'nt':
            subprocess.run(["lsof", "-ti:8000"], stdout=subprocess.PIPE)
            subprocess.run(["kill", "-9"], input=subprocess.run(["lsof", "-ti:8000"], stdout=subprocess.PIPE).stdout)
            subprocess.run(["lsof", "-ti:7777"], stdout=subprocess.PIPE)
            subprocess.run(["kill", "-9"], input=subprocess.run(["lsof", "-ti:7777"], stdout=subprocess.PIPE).stdout)
        else:
            subprocess.run(["taskkill", "/F", "/IM", "python.exe"], stderr=subprocess.DEVNULL)
            subprocess.run(["taskkill", "/F", "/IM", "node.exe"], stderr=subprocess.DEVNULL)
        
        self.backend_running = False
        self.frontend_running = False
        self.toggle_state = False
        self.update_toggle_display()
    
    def update_status(self):
        """Update server status display"""
        # Check backend
        if requests:
            try:
                response = requests.get("http://localhost:8000/health", timeout=1)
                if response.status_code == 200:
                    self.backend_status.config(text="Backend: Running", fg="#34c759")
                    self.backend_running = True
                else:
                    self.backend_status.config(text="Backend: Stopped", fg="#86868b")
                    self.backend_running = False
            except:
                self.backend_status.config(text="Backend: Stopped", fg="#86868b")
                self.backend_running = False
        else:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex(('localhost', 8000))
                sock.close()
                if result == 0:
                    self.backend_status.config(text="Backend: Running", fg="#34c759")
                    self.backend_running = True
                else:
                    self.backend_status.config(text="Backend: Stopped", fg="#86868b")
                    self.backend_running = False
            except:
                self.backend_status.config(text="Backend: Stopped", fg="#86868b")
                self.backend_running = False
        
        # Check frontend
        if requests:
            try:
                response = requests.get("http://localhost:7777", timeout=1)
                if response.status_code == 200:
                    self.frontend_status.config(text="Frontend: Running", fg="#34c759")
                    self.frontend_running = True
                else:
                    self.frontend_status.config(text="Frontend: Stopped", fg="#86868b")
                    self.frontend_running = False
            except:
                self.frontend_status.config(text="Frontend: Stopped", fg="#86868b")
                self.frontend_running = False
        else:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex(('localhost', 7777))
                sock.close()
                if result == 0:
                    self.frontend_status.config(text="Frontend: Running", fg="#34c759")
                    self.frontend_running = True
                else:
                    self.frontend_status.config(text="Frontend: Stopped", fg="#86868b")
                    self.frontend_running = False
            except:
                self.frontend_status.config(text="Frontend: Stopped", fg="#86868b")
                self.frontend_running = False
        
        # Update toggle state
        if self.backend_running or self.frontend_running:
            self.toggle_state = True
        else:
            self.toggle_state = False
        self.update_toggle_display()
        
        # Schedule next update
        self.root.after(2000, self.update_status)
    
    def check_for_updates(self):
        """Check GitHub for updates"""
        def check():
            try:
                import urllib.request
                import json
                
                # Check GitHub releases API
                url = "https://api.github.com/repos/austinbrady/PersonalAI/releases/latest"
                req = urllib.request.Request(url)
                req.add_header('User-Agent', 'PersonalAI-Updater')
                
                with urllib.request.urlopen(req, timeout=5) as response:
                    data = json.loads(response.read().decode())
                    self.latest_version = data.get('tag_name', '').replace('v', '')
                    
                    # Compare versions (simple string comparison)
                    if self.latest_version and self.latest_version != self.current_version:
                        self.update_available = True
                        self.show_update_indicator()
                    else:
                        self.update_available = False
                        self.hide_update_indicator()
            except Exception as e:
                # Silently fail - network issues shouldn't break the app
                pass
        
        # Run in background thread
        threading.Thread(target=check, daemon=True).start()
        
        # Check again in 5 minutes
        self.root.after(300000, self.check_for_updates)
    
    def show_update_indicator(self):
        """Show blue neon update indicator"""
        if not self.update_indicator.winfo_viewable():
            self.update_indicator.pack(side=tk.LEFT, padx=20)
            self.update_button.pack(side=tk.RIGHT, padx=20)
        
        # Animate the blue neon light (blink effect)
        self.animate_update_indicator()
    
    def hide_update_indicator(self):
        """Hide update indicator"""
        self.update_indicator.pack_forget()
        self.update_button.pack_forget()
    
    def animate_update_indicator(self):
        """Animate the blue neon light with blinking effect"""
        if not self.update_available:
            return
        
        current_fg = self.update_indicator.cget("fg")
        if current_fg == "#00FFFF":
            self.update_indicator.config(fg="#0066FF")
        else:
            self.update_indicator.config(fg="#00FFFF")
        
        # Continue animation
        self.root.after(500, self.animate_update_indicator)
    
    def download_update(self):
        """Download and apply update from GitHub"""
        import subprocess
        
        response = messagebox.askyesno(
            "Update Available",
            f"Version {self.latest_version} is available.\n\n"
            "This will pull the latest code from GitHub.\n"
            "Continue?"
        )
        
        if response:
            try:
                # Pull latest from GitHub
                subprocess.run(
                    ["git", "pull", "origin", "main"],
                    cwd=str(self.project_dir),
                    check=True
                )
                
                messagebox.showinfo(
                    "Update Complete",
                    "Update downloaded successfully!\n\n"
                    "Please restart the application to apply changes."
                )
                
                # Restart the application
                self.root.after(1000, self.restart_app)
            except subprocess.CalledProcessError:
                messagebox.showerror(
                    "Update Failed",
                    "Failed to download update.\n\n"
                    "Make sure you have git installed and the repository is set up correctly."
                )
            except FileNotFoundError:
                messagebox.showerror(
                    "Update Failed",
                    "Git is not installed.\n\n"
                    "Please update manually by pulling from GitHub."
                )
    
    def restart_app(self):
        """Restart the application"""
        import sys
        import os
        
        python = sys.executable
        os.execl(python, python, *sys.argv)

if __name__ == "__main__":
    try:
        root = tk.Tk()
        app = PersonalAILauncher(root)
        root.mainloop()
    except Exception as e:
        print(f"Error launching GUI: {e}")
        print("\nTrying alternative launch method...")
        # Fallback: try with environment variable to bypass version check
        import os
        os.environ['TK_SILENCE_DEPRECATION'] = '1'
        try:
            root = tk.Tk()
            app = PersonalAILauncher(root)
            root.mainloop()
        except Exception as e2:
            print(f"GUI launch failed: {e2}")
            print("\nPlease try running the servers manually:")
            print("  Backend: cd backend && source venv/bin/activate && python main.py")
            print("  Frontend: cd frontend && npm run dev")
            sys.exit(1)

