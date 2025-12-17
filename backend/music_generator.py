"""
Local Music Generation using MusicGen (Meta AudioCraft)
100% LOCAL - No external API calls
"""

import torch
from audiocraft.models import MusicGen
from audiocraft.data.audio import audio_write
import os
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class MusicGenerator:
    def __init__(self, model_name: str = "facebook/musicgen-small"):
        """
        Initialize MusicGen model
        
        Available models:
        - facebook/musicgen-small (300M params, faster)
        - facebook/musicgen-medium (1.5B params, better quality)
        - facebook/musicgen-large (3.3B params, best quality, requires more VRAM)
        """
        self.model_name = model_name
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"MusicGenerator initialized with device: {self.device}")
    
    def load_model(self):
        """Lazy load the model (only when needed)"""
        if self.model is None:
            try:
                logger.info(f"Loading MusicGen model: {self.model_name}")
                self.model = MusicGen.get_pretrained(self.model_name)
                self.model.set_generation_params(duration=30)  # 30 seconds default
                logger.info("MusicGen model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load MusicGen model: {e}")
                raise
    
    def generate(
        self,
        descriptions: list[str],
        duration: int = 30,
        output_dir: Path = Path("generated_music"),
        filename: str = "song"
    ) -> Path:
        """
        Generate music from text descriptions
        
        Args:
            descriptions: List of text prompts describing the music
            duration: Duration in seconds (max 30 for small, 120 for medium/large)
            output_dir: Directory to save the generated audio
            filename: Base filename for output
        
        Returns:
            Path to the generated audio file
        """
        if self.model is None:
            self.load_model()
        
        # Set generation duration
        self.model.set_generation_params(duration=duration)
        
        # Generate audio
        logger.info(f"Generating music for: {descriptions}")
        wav = self.model.generate(descriptions)
        
        # Save audio file
        output_dir.mkdir(parents=True, exist_ok=True)
        audio_path = audio_write(
            str(output_dir / filename),
            wav[0].cpu(),
            self.model.sample_rate,
            format="wav"
        )
        
        # Return the path to the .wav file
        return Path(audio_path[0] + ".wav")
    
    def generate_with_lyrics(
        self,
        prompt: str,
        lyrics: Optional[str] = None,
        for_fans_of: Optional[str] = None,
        genre: Optional[str] = None,
        mood: Optional[str] = None,
        duration: int = 30,
        output_dir: Path = Path("generated_music"),
        filename: str = "song"
    ) -> Path:
        """
        Generate music with enhanced prompt from lyrics and metadata
        """
        # Build comprehensive description
        description_parts = [prompt]
        
        if for_fans_of:
            description_parts.append(f"in the style of {for_fans_of}")
        
        if genre:
            description_parts.append(f"{genre} genre")
        
        if mood:
            description_parts.append(f"{mood} mood")
        
        if lyrics:
            # Use first few lines of lyrics as context
            lyrics_preview = "\n".join(lyrics.split("\n")[:4])
            description_parts.append(f"with lyrics about: {lyrics_preview}")
        
        full_description = ", ".join(description_parts)
        
        return self.generate(
            descriptions=[full_description],
            duration=duration,
            output_dir=output_dir,
            filename=filename
        )

# Global instance (lazy loaded)
_music_generator: Optional[MusicGenerator] = None

def get_music_generator(model_name: str = "facebook/musicgen-small") -> MusicGenerator:
    """Get or create the global music generator instance"""
    global _music_generator
    if _music_generator is None:
        _music_generator = MusicGenerator(model_name=model_name)
    return _music_generator

