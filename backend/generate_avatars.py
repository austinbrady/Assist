"""
Generate anime-style avatars for AI assistants
Creates talking/expressive anime character images in Megaman-style
Supports incremental updates based on "last look" tracking
"""
from PIL import Image, ImageDraw, ImageFont
import os
import json
from pathlib import Path
from typing import Tuple, Dict
import auth
from datetime import datetime

AVATARS_DIR = Path("avatars")
AVATARS_DIR.mkdir(exist_ok=True)
AVATAR_METADATA_FILE = AVATARS_DIR / "avatar_metadata.json"

def load_avatar_metadata() -> dict:
    """Load avatar metadata (last look tracking)"""
    if AVATAR_METADATA_FILE.exists():
        try:
            with open(AVATAR_METADATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_avatar_metadata(metadata: dict):
    """Save avatar metadata"""
    with open(AVATAR_METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)


def get_last_look(assistant_id: str) -> dict:
    """Get the last look/version for an assistant"""
    metadata = load_avatar_metadata()
    return metadata.get(assistant_id, {
        "version": 0,
        "last_updated": None,
        "features": {}
    })


def update_last_look(assistant_id: str, features: dict):
    """Update the last look metadata for an assistant"""
    metadata = load_avatar_metadata()
    old_version = metadata.get(assistant_id, {}).get("version", 0)
    metadata[assistant_id] = {
        "version": old_version + 1,
        "last_updated": datetime.now().isoformat(),
        "features": features,
        "update_notified": {}  # Track which users have been notified: {username: timestamp}
    }
    save_avatar_metadata(metadata)
    return old_version + 1  # Return new version number


def check_avatar_update(assistant_id: str, username: str) -> Tuple[bool, Dict]:
    """
    Check if assistant's avatar was updated since user last saw it
    Returns: (has_update, update_info)
    """
    metadata = load_avatar_metadata()
    assistant_meta = metadata.get(assistant_id, {})
    
    if not assistant_meta or not assistant_meta.get("last_updated"):
        return False, {}
    
    # Check if user has been notified about this version
    update_notified = assistant_meta.get("update_notified", {})
    user_notified_version = update_notified.get(username, {}).get("version", 0)
    current_version = assistant_meta.get("version", 0)
    
    # If current version is newer than what user saw, there's an update
    if current_version > user_notified_version:
        return True, {
            "version": current_version,
            "last_updated": assistant_meta.get("last_updated"),
            "features": assistant_meta.get("features", {})
        }
    
    return False, {}


def mark_update_seen(assistant_id: str, username: str):
    """Mark that user has been notified about the avatar update"""
    metadata = load_avatar_metadata()
    if assistant_id not in metadata:
        return
    
    if "update_notified" not in metadata[assistant_id]:
        metadata[assistant_id]["update_notified"] = {}
    
    current_version = metadata[assistant_id].get("version", 0)
    metadata[assistant_id]["update_notified"][username] = {
        "version": current_version,
        "notified_at": datetime.now().isoformat()
    }
    save_avatar_metadata(metadata)


def generate_anime_avatar(assistant: dict, size: int = 256, update_features: dict = None):
    """
    Generate an anime-style avatar for an assistant
    If update_features is provided, it will update based on the last look
    """
    # Get last look to maintain consistency
    last_look = get_last_look(assistant['id'])
    
    # Merge update features with last look features
    if update_features:
        features = {**last_look.get("features", {}), **update_features}
    else:
        features = last_look.get("features", {})
    
    # Create base image
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)
    
    # Get color (can be overridden by features)
    color = features.get('color', assistant['color'])
    # Convert hex to RGB
    color_rgb = tuple(int(color[i:i+2], 16) for i in (1, 3, 5))
    
    # Draw anime-style head (circle)
    # Allow customization via features
    head_scale = features.get('head_scale', 0.6)
    head_size = int(size * head_scale)
    head_x = (size - head_size) // 2
    head_y_offset = features.get('head_y_offset', 0.15)
    head_y = int(size * head_y_offset)
    draw.ellipse([head_x, head_y, head_x + head_size, head_y + head_size], 
                 fill=color_rgb, outline=(0, 0, 0), width=2)
    
    # Draw hair (anime style - flowing)
    # Allow customization via features
    hair_style = features.get('hair_style', 'flowing')  # 'flowing', 'spiky', 'curly', 'straight'
    hair_color = features.get('hair_color', color)
    hair_color_rgb = tuple(int(hair_color[i:i+2], 16) for i in (1, 3, 5)) if hair_color.startswith('#') else color_rgb
    
    if hair_style == 'flowing':
        hair_points = [
            (head_x + head_size * 0.2, head_y),
            (head_x + head_size * 0.8, head_y),
            (head_x + head_size * 0.9, head_y - head_size * 0.3),
            (head_x + head_size * 0.7, head_y - head_size * 0.4),
            (head_x + head_size * 0.3, head_y - head_size * 0.4),
            (head_x + head_size * 0.1, head_y - head_size * 0.3),
        ]
    elif hair_style == 'spiky':
        hair_points = [
            (head_x + head_size * 0.2, head_y),
            (head_x + head_size * 0.8, head_y),
            (head_x + head_size * 0.85, head_y - head_size * 0.25),
            (head_x + head_size * 0.7, head_y - head_size * 0.35),
            (head_x + head_size * 0.5, head_y - head_size * 0.4),
            (head_x + head_size * 0.3, head_y - head_size * 0.35),
            (head_x + head_size * 0.15, head_y - head_size * 0.25),
        ]
    else:  # default flowing
        hair_points = [
            (head_x + head_size * 0.2, head_y),
            (head_x + head_size * 0.8, head_y),
            (head_x + head_size * 0.9, head_y - head_size * 0.3),
            (head_x + head_size * 0.7, head_y - head_size * 0.4),
            (head_x + head_size * 0.3, head_y - head_size * 0.4),
            (head_x + head_size * 0.1, head_y - head_size * 0.3),
        ]
    draw.polygon(hair_points, fill=hair_color_rgb, outline=(0, 0, 0), width=2)
    
    # Draw eyes (anime style - large and expressive)
    # Allow customization via features
    eye_size_scale = features.get('eye_size_scale', 0.15)
    eye_size = int(head_size * eye_size_scale)
    eye_spacing = features.get('eye_spacing', 0.4)  # Distance between eyes
    left_eye_x = head_x + head_size * (0.5 - eye_spacing/2)
    right_eye_x = head_x + head_size * (0.5 + eye_spacing/2)
    eye_y = head_y + head_size * 0.35
    
    # Eye whites
    draw.ellipse([left_eye_x - eye_size, eye_y - eye_size, 
                  left_eye_x + eye_size, eye_y + eye_size], 
                 fill=(255, 255, 255), outline=(0, 0, 0), width=2)
    draw.ellipse([right_eye_x - eye_size, eye_y - eye_size, 
                  right_eye_x + eye_size, eye_y + eye_size], 
                 fill=(255, 255, 255), outline=(0, 0, 0), width=2)
    
    # Eye pupils (looking forward - talking expression)
    pupil_size = int(eye_size * 0.6)
    draw.ellipse([left_eye_x - pupil_size//2, eye_y - pupil_size//2,
                  left_eye_x + pupil_size//2, eye_y + pupil_size//2],
                 fill=(0, 0, 0))
    draw.ellipse([right_eye_x - pupil_size//2, eye_y - pupil_size//2,
                  right_eye_x + pupil_size//2, eye_y + pupil_size//2],
                 fill=(0, 0, 0))
    
    # Draw mouth (talking - open slightly)
    # Allow customization via features
    mouth_expression = features.get('mouth_expression', 'talking')  # 'talking', 'smile', 'neutral'
    mouth_x = head_x + head_size * 0.5
    mouth_y = head_y + head_size * 0.65
    mouth_width = int(head_size * 0.2)
    mouth_height = int(head_size * 0.1)
    
    if mouth_expression == 'smile':
        # Draw smile curve
        draw.arc([mouth_x - mouth_width//2, mouth_y - mouth_height//2,
                  mouth_x + mouth_width//2, mouth_y + mouth_height//2],
                 start=0, end=180, fill=(0, 0, 0), width=3)
    elif mouth_expression == 'neutral':
        # Draw neutral line
        draw.line([mouth_x - mouth_width//2, mouth_y,
                   mouth_x + mouth_width//2, mouth_y],
                  fill=(0, 0, 0), width=2)
    else:  # talking (default)
        draw.ellipse([mouth_x - mouth_width//2, mouth_y - mouth_height//2,
                      mouth_x + mouth_width//2, mouth_y + mouth_height//2],
                     fill=(0, 0, 0))
    
    # Draw body/robes (based on assistant type)
    body_y = head_y + head_size
    body_height = int(size * 0.4)
    body_width = int(size * 0.5)
    body_x = (size - body_width) // 2
    
    # Robe/tunic shape
    robe_points = [
        (body_x, body_y),
        (body_x + body_width, body_y),
        (body_x + body_width * 0.9, body_y + body_height),
        (body_x + body_width * 0.1, body_y + body_height),
    ]
    draw.polygon(robe_points, fill=color_rgb, outline=(0, 0, 0), width=2)
    
    # Add accessory based on assistant
    if 'sword' in assistant.get('avatar_style', '').lower():
        # Draw sword
        sword_x = body_x + body_width * 0.8
        sword_y = body_y
        sword_length = int(size * 0.3)
        draw.rectangle([sword_x, sword_y, sword_x + 3, sword_y + sword_length],
                      fill=(200, 200, 200), outline=(0, 0, 0))
    elif 'staff' in assistant.get('avatar_style', '').lower():
        # Draw staff
        staff_x = body_x + body_width * 0.2
        staff_y = body_y
        staff_length = int(size * 0.35)
        draw.rectangle([staff_x, staff_y, staff_x + 3, staff_y + staff_length],
                      fill=(139, 69, 19), outline=(0, 0, 0))
    elif 'book' in assistant.get('avatar_style', '').lower():
        # Draw book
        book_x = body_x + body_width * 0.7
        book_y = body_y + body_height * 0.3
        book_size = int(size * 0.15)
        draw.rectangle([book_x, book_y, book_x + book_size, book_y + book_size * 0.7],
                      fill=(255, 255, 200), outline=(0, 0, 0), width=2)
    
    # Add name text at bottom
    try:
        # Try to use a font, fallback to default
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
    except:
        font = ImageFont.load_default()
    
    text = assistant['name']
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_x = (size - text_width) // 2
    text_y = size - 25
    draw.text((text_x, text_y), text, fill=(0, 0, 0), font=font)
    
    # Save features to metadata if this was an update
    if update_features:
        update_last_look(assistant['id'], features)
    
    return img


def generate_all_avatars(update_features: Dict = None):
    """
    Generate avatars for all assistants
    If update_features is provided, it will update all avatars with those features
    """
    assistants = auth.get_all_assistants()
    
    for assistant in assistants:
        # If update_features provided, use it; otherwise use assistant-specific features
        features = update_features if update_features else None
        avatar = generate_anime_avatar(assistant, update_features=features)
        avatar_path = AVATARS_DIR / f"{assistant['id']}.png"
        avatar.save(avatar_path, "PNG")
        
        if features:
            print(f"Updated avatar for {assistant['name']} (v{get_last_look(assistant['id']).get('version', 0)}): {avatar_path}")
        else:
            print(f"Generated avatar for {assistant['name']}: {avatar_path}")
    
    print(f"\n✅ Generated {len(assistants)} avatars in {AVATARS_DIR}/")


def generate_user_avatar(username: str, user_profile: dict = None, size: int = 256) -> Image.Image:
    """
    Generate a unique anime-style avatar for a user
    Based on username and profile to ensure uniqueness
    Uses the same style as assistant avatars but personalized
    """
    import hashlib
    
    # Create deterministic but unique features based on username
    username_hash = hashlib.md5(username.encode()).hexdigest()
    
    # Generate color from hash (first 6 chars)
    color_hex = f"#{username_hash[:6]}"
    # Ensure color is not too dark or too light
    color_rgb = tuple(int(color_hex[i:i+2], 16) for i in (1, 3, 5))
    # Adjust brightness if needed
    if sum(color_rgb) < 200:  # Too dark
        color_rgb = tuple(min(255, c + 100) for c in color_rgb)
    elif sum(color_rgb) > 600:  # Too light
        color_rgb = tuple(max(0, c - 100) for c in color_rgb)
    color_hex = f"#{color_rgb[0]:02x}{color_rgb[1]:02x}{color_rgb[2]:02x}"
    
    # Generate features from hash
    hash_int = int(username_hash[:8], 16)
    
    # Hair styles
    hair_styles = ['flowing', 'spiky', 'curly', 'straight']
    hair_style = hair_styles[hash_int % len(hair_styles)]
    
    # Hair color (slightly different from main color)
    hair_color_offset = (hash_int % 50) - 25
    hair_color_rgb = tuple(max(0, min(255, c + hair_color_offset)) for c in color_rgb)
    hair_color_hex = f"#{hair_color_rgb[0]:02x}{hair_color_rgb[1]:02x}{hair_color_rgb[2]:02x}"
    
    # Eye spacing
    eye_spacing = 0.35 + (hash_int % 20) / 100  # 0.35 to 0.55
    
    # Head scale
    head_scale = 0.55 + (hash_int % 15) / 100  # 0.55 to 0.70
    
    # Mouth expression
    mouth_expressions = ['talking', 'smile', 'neutral']
    mouth_expression = mouth_expressions[(hash_int // 100) % len(mouth_expressions)]
    
    # Create base image
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw anime-style head
    head_size = int(size * head_scale)
    head_x = (size - head_size) // 2
    head_y = int(size * 0.15)
    draw.ellipse([head_x, head_y, head_x + head_size, head_y + head_size], 
                 fill=color_rgb, outline=(0, 0, 0), width=2)
    
    # Draw hair
    if hair_style == 'flowing':
        hair_points = [
            (head_x + head_size * 0.2, head_y),
            (head_x + head_size * 0.8, head_y),
            (head_x + head_size * 0.9, head_y - head_size * 0.3),
            (head_x + head_size * 0.7, head_y - head_size * 0.4),
            (head_x + head_size * 0.3, head_y - head_size * 0.4),
            (head_x + head_size * 0.1, head_y - head_size * 0.3),
        ]
    elif hair_style == 'spiky':
        hair_points = [
            (head_x + head_size * 0.2, head_y),
            (head_x + head_size * 0.8, head_y),
            (head_x + head_size * 0.85, head_y - head_size * 0.25),
            (head_x + head_size * 0.7, head_y - head_size * 0.35),
            (head_x + head_size * 0.5, head_y - head_size * 0.4),
            (head_x + head_size * 0.3, head_y - head_size * 0.35),
            (head_x + head_size * 0.15, head_y - head_size * 0.25),
        ]
    elif hair_style == 'curly':
        hair_points = [
            (head_x + head_size * 0.2, head_y),
            (head_x + head_size * 0.8, head_y),
            (head_x + head_size * 0.75, head_y - head_size * 0.35),
            (head_x + head_size * 0.6, head_y - head_size * 0.45),
            (head_x + head_size * 0.4, head_y - head_size * 0.45),
            (head_x + head_size * 0.25, head_y - head_size * 0.35),
        ]
    else:  # straight
        hair_points = [
            (head_x + head_size * 0.2, head_y),
            (head_x + head_size * 0.8, head_y),
            (head_x + head_size * 0.8, head_y - head_size * 0.3),
            (head_x + head_size * 0.2, head_y - head_size * 0.3),
        ]
    draw.polygon(hair_points, fill=hair_color_rgb, outline=(0, 0, 0), width=2)
    
    # Draw eyes
    eye_size = int(head_size * 0.15)
    left_eye_x = head_x + head_size * (0.5 - eye_spacing/2)
    right_eye_x = head_x + head_size * (0.5 + eye_spacing/2)
    eye_y = head_y + head_size * 0.35
    
    # Eye whites
    draw.ellipse([left_eye_x - eye_size, eye_y - eye_size, 
                  left_eye_x + eye_size, eye_y + eye_size], 
                 fill=(255, 255, 255), outline=(0, 0, 0), width=2)
    draw.ellipse([right_eye_x - eye_size, eye_y - eye_size, 
                  right_eye_x + eye_size, eye_y + eye_size], 
                 fill=(255, 255, 255), outline=(0, 0, 0), width=2)
    
    # Eye pupils
    pupil_size = int(eye_size * 0.6)
    draw.ellipse([left_eye_x - pupil_size//2, eye_y - pupil_size//2,
                  left_eye_x + pupil_size//2, eye_y + pupil_size//2],
                 fill=(0, 0, 0))
    draw.ellipse([right_eye_x - pupil_size//2, eye_y - pupil_size//2,
                  right_eye_x + pupil_size//2, eye_y + pupil_size//2],
                 fill=(0, 0, 0))
    
    # Draw mouth
    mouth_x = head_x + head_size * 0.5
    mouth_y = head_y + head_size * 0.65
    mouth_width = int(head_size * 0.2)
    mouth_height = int(head_size * 0.1)
    
    if mouth_expression == 'smile':
        draw.arc([mouth_x - mouth_width//2, mouth_y - mouth_height//2,
                  mouth_x + mouth_width//2, mouth_y + mouth_height//2],
                 start=0, end=180, fill=(0, 0, 0), width=3)
    elif mouth_expression == 'neutral':
        draw.line([mouth_x - mouth_width//2, mouth_y,
                   mouth_x + mouth_width//2, mouth_y],
                  fill=(0, 0, 0), width=2)
    else:  # talking
        draw.ellipse([mouth_x - mouth_width//2, mouth_y - mouth_height//2,
                      mouth_x + mouth_width//2, mouth_y + mouth_height//2],
                     fill=(0, 0, 0))
    
    # Draw body
    body_y = head_y + head_size
    body_height = int(size * 0.4)
    body_width = int(size * 0.5)
    body_x = (size - body_width) // 2
    
    robe_points = [
        (body_x, body_y),
        (body_x + body_width, body_y),
        (body_x + body_width * 0.9, body_y + body_height),
        (body_x + body_width * 0.1, body_y + body_height),
    ]
    draw.polygon(robe_points, fill=color_rgb, outline=(0, 0, 0), width=2)
    
    # Add username initial or first letter at bottom
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
    except:
        font = ImageFont.load_default()
    
    text = username[0].upper() if username else "U"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_x = (size - text_width) // 2
    text_y = size - 30
    draw.text((text_x, text_y), text, fill=(0, 0, 0), font=font)
    
    return img


def get_or_generate_user_avatar(username: str, user_profile: dict = None) -> Path:
    """
    Get user avatar path, generating it if it doesn't exist
    Returns: Path to avatar image
    """
    USER_AVATARS_DIR = Path("users") / username
    USER_AVATARS_DIR.mkdir(parents=True, exist_ok=True)
    avatar_path = USER_AVATARS_DIR / "avatar.png"
    
    # Generate if doesn't exist
    if not avatar_path.exists():
        avatar = generate_user_avatar(username, user_profile)
        avatar.save(avatar_path, "PNG")
        print(f"Generated user avatar for {username}: {avatar_path}")
    
    return avatar_path


if __name__ == "__main__":
    generate_all_avatars()

