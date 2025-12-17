"""
Simple auth module for Prompt Writer
Can be extended to use the main auth system if needed
"""

from typing import Optional
import os

def get_current_user(authorization: Optional[str]) -> Optional[str]:
    """
    Extract user from authorization header
    For now, returns a default user - can be extended to use main auth system
    """
    if not authorization:
        return None
    
    # Simple extraction - can be enhanced to use JWT from main auth system
    if authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        # For now, return default user
        # TODO: Validate token with main auth system
        return "default_user"
    
    return None

