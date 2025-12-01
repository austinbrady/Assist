"""
File and Document Management System
Handles logs, documents, and photo organization for Personal AI
"""

import json
import os
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
import shutil
from PIL import Image
try:
    import exifread
    EXIFREAD_AVAILABLE = True
except ImportError:
    EXIFREAD_AVAILABLE = False


def get_user_logs_dir(username: str) -> Path:
    """Get user-specific logs directory"""
    user_dir = Path("users_data") / username / "logs"
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir


def get_user_documents_dir(username: str) -> Path:
    """Get user-specific documents directory"""
    user_dir = Path("users_data") / username / "documents"
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir


def get_user_photos_dir(username: str) -> Path:
    """Get user-specific photos directory"""
    user_dir = Path("users_data") / username / "photos"
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir


def log_skill_activity(username: str, skill_id: str, activity_type: str, details: Dict) -> str:
    """
    Log skill activity to a detailed log file
    
    Returns:
        log_file_path: Path to the created log file
    """
    logs_dir = get_user_logs_dir(username)
    skill_logs_dir = logs_dir / skill_id
    skill_logs_dir.mkdir(parents=True, exist_ok=True)
    
    # Create log entry
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "activity_type": activity_type,
        "details": details,
        "skill_id": skill_id
    }
    
    # Save to daily log file
    today = datetime.now().strftime("%Y-%m-%d")
    daily_log_file = skill_logs_dir / f"{today}.json"
    
    # Load existing logs for today
    daily_logs = []
    if daily_log_file.exists():
        try:
            with open(daily_log_file, 'r', encoding='utf-8') as f:
                daily_logs = json.load(f)
        except Exception:
            pass
    
    daily_logs.append(log_entry)
    
    # Save updated logs
    with open(daily_log_file, 'w', encoding='utf-8') as f:
        json.dump(daily_logs, f, indent=2, ensure_ascii=False)
    
    # Also create/update document log if this is a document-related activity
    if activity_type in ["document_created", "document_edited", "document_opened"]:
        document_id = details.get("document_id", f"doc_{datetime.now().timestamp()}")
        document_log_file = skill_logs_dir / f"document_{document_id}.json"
        
        document_log = {
            "document_id": document_id,
            "skill_id": skill_id,
            "created_at": log_entry["timestamp"],
            "last_accessed": log_entry["timestamp"],
            "activity_history": [log_entry]
        }
        
        if document_log_file.exists():
            try:
                with open(document_log_file, 'r', encoding='utf-8') as f:
                    existing_log = json.load(f)
                    document_log["created_at"] = existing_log.get("created_at", log_entry["timestamp"])
                    document_log["activity_history"] = existing_log.get("activity_history", []) + [log_entry]
            except Exception:
                pass
        
        with open(document_log_file, 'w', encoding='utf-8') as f:
            json.dump(document_log, f, indent=2, ensure_ascii=False)
    
    return str(daily_log_file)


def get_recent_documents(username: str, skill_id: Optional[str] = None, limit: int = 25) -> List[Dict]:
    """
    Get recent documents sorted by last accessed time
    
    Args:
        username: User username
        skill_id: Optional skill ID to filter by
        limit: Maximum number of documents to return
    
    Returns:
        List of document info dictionaries sorted by last_accessed (most recent first)
    """
    logs_dir = get_user_logs_dir(username)
    documents = []
    
    # Search in skill-specific logs or all logs
    if skill_id:
        search_dirs = [logs_dir / skill_id]
    else:
        search_dirs = [d for d in logs_dir.iterdir() if d.is_dir()]
    
    for skill_log_dir in search_dirs:
        if not skill_log_dir.exists():
            continue
        
        # Find all document log files
        for doc_log_file in skill_log_dir.glob("document_*.json"):
            try:
                with open(doc_log_file, 'r', encoding='utf-8') as f:
                    doc_log = json.load(f)
                
                documents.append({
                    "document_id": doc_log.get("document_id", doc_log_file.stem),
                    "skill_id": doc_log.get("skill_id", skill_log_dir.name),
                    "created_at": doc_log.get("created_at"),
                    "last_accessed": doc_log.get("last_accessed", doc_log.get("created_at")),
                    "activity_count": len(doc_log.get("activity_history", [])),
                    "log_file": str(doc_log_file)
                })
            except Exception:
                continue
    
    # Sort by last_accessed (most recent first)
    documents.sort(key=lambda x: x.get("last_accessed", ""), reverse=True)
    
    return documents[:limit]


def organize_photo(username: str, photo_path: Path, photo_metadata: Optional[Dict] = None) -> Dict:
    """
    Organize photo into appropriate folder based on AI analysis
    
    Organization rules:
    - By date (default)
    - By trip (if location data suggests travel)
    - By people (if multiple people detected)
    - By location (if same location detected)
    
    Returns:
        Dict with organization info including final_path
    """
    photos_dir = get_user_photos_dir(username)
    
    # Default: organize by date
    date_folder = datetime.now().strftime("%Y-%m-%d")
    date_dir = photos_dir / "by_date" / date_folder
    date_dir.mkdir(parents=True, exist_ok=True)
    
    # Try to extract metadata
    try:
        if not EXIFREAD_AVAILABLE:
            raise ImportError("exifread not available")
        with open(photo_path, 'rb') as f:
            tags = exifread.process_file(f)
            
            # Extract date
            if 'EXIF DateTimeOriginal' in tags:
                photo_date_str = str(tags['EXIF DateTimeOriginal'])
                try:
                    photo_date = datetime.strptime(photo_date_str, "%Y:%m:%d %H:%M:%S")
                    date_folder = photo_date.strftime("%Y-%m-%d")
                    date_dir = photos_dir / "by_date" / date_folder
                    date_dir.mkdir(parents=True, exist_ok=True)
                except Exception:
                    pass
            
            # Extract location if available
            location_info = {}
            if 'GPS GPSLatitude' in tags and 'GPS GPSLongitude' in tags:
                location_info = {
                    "latitude": str(tags['GPS GPSLatitude']),
                    "longitude": str(tags['GPS GPSLongitude'])
                }
    except Exception:
        # If EXIF reading fails, use current date
        pass
    
    # For now, save to date folder
    # In the future, AI can analyze and move to trip/people/location folders
    final_path = date_dir / photo_path.name
    
    # Copy photo if it's not already there
    if photo_path != final_path and not final_path.exists():
        shutil.copy2(photo_path, final_path)
    
    organization_info = {
        "original_path": str(photo_path),
        "organized_path": str(final_path),
        "date_folder": date_folder,
        "organization_type": "by_date",
        "metadata": photo_metadata or {}
    }
    
    # Log photo organization
    log_photo_organization(username, organization_info)
    
    return organization_info


def log_photo_organization(username: str, organization_info: Dict):
    """Log photo organization for AI learning"""
    logs_dir = get_user_logs_dir(username)
    photo_logs_dir = logs_dir / "photo_organization"
    photo_logs_dir.mkdir(parents=True, exist_ok=True)
    
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "organization_info": organization_info
    }
    
    today = datetime.now().strftime("%Y-%m-%d")
    daily_log_file = photo_logs_dir / f"{today}.json"
    
    daily_logs = []
    if daily_log_file.exists():
        try:
            with open(daily_log_file, 'r', encoding='utf-8') as f:
                daily_logs = json.load(f)
        except Exception:
            pass
    
    daily_logs.append(log_entry)
    
    with open(daily_log_file, 'w', encoding='utf-8') as f:
        json.dump(daily_logs, f, indent=2, ensure_ascii=False)


def get_user_folders_path(username: str) -> Path:
    """Get the main user folders path (for opening in file explorer)"""
    return Path("users_data") / username


def open_folder_in_explorer(folder_path: Path):
    """Open folder in system file explorer"""
    import platform
    import subprocess
    
    folder_path = Path(folder_path).resolve()
    
    if platform.system() == "Windows":
        subprocess.Popen(f'explorer "{folder_path}"')
    elif platform.system() == "Darwin":  # macOS
        subprocess.Popen(["open", str(folder_path)])
    else:  # Linux
        subprocess.Popen(["xdg-open", str(folder_path)])

