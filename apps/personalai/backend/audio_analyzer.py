"""
Audio Analysis Module for Music Generation
Analyzes reference songs to extract musical features for better generation
"""

import librosa
import numpy as np
from pathlib import Path
from typing import Dict, Optional, List
import logging
import json

logger = logging.getLogger(__name__)

class AudioAnalyzer:
    """Analyze audio files to extract musical features"""
    
    def __init__(self):
        self.supported_formats = ['.mp3', '.wav', '.flac', '.m4a', '.ogg']
    
    def analyze_audio(self, audio_path: Path) -> Dict:
        """
        Analyze audio file and extract musical features
        
        Returns:
            Dictionary with extracted features:
            - tempo: BPM
            - key: Musical key
            - mode: Major/minor
            - energy: Energy level (0-1)
            - danceability: Danceability score (0-1)
            - valence: Positivity/negativity (0-1)
            - genre: Detected genre
            - mood: Detected mood
            - instrumentation: Detected instruments
            - structure: Song structure analysis
        """
        try:
            logger.info(f"Analyzing audio file: {audio_path}")
            
            # Load audio file
            y, sr = librosa.load(str(audio_path), duration=60)  # Analyze first 60 seconds
            
            features = {}
            
            # 1. Tempo (BPM)
            tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
            features['tempo'] = float(tempo)
            
            # 2. Key and Mode
            chroma = librosa.feature.chroma_stft(y=y, sr=sr)
            key_profile = np.mean(chroma, axis=1)
            key_idx = np.argmax(key_profile)
            keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
            features['key'] = keys[key_idx]
            
            # Determine major/minor mode
            # Compare energy in different frequency bands
            spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            mode_score = np.mean(spectral_centroid)
            features['mode'] = 'major' if mode_score > np.median(spectral_centroid) else 'minor'
            
            # 3. Energy
            rms = librosa.feature.rms(y=y)[0]
            features['energy'] = float(np.mean(rms))
            
            # 4. Danceability (based on rhythm regularity)
            onset_frames = librosa.onset.onset_detect(y=y, sr=sr)
            onset_times = librosa.frames_to_time(onset_frames, sr=sr)
            if len(onset_times) > 1:
                intervals = np.diff(onset_times)
                regularity = 1.0 / (1.0 + np.std(intervals))
                features['danceability'] = float(np.clip(regularity, 0, 1))
            else:
                features['danceability'] = 0.5
            
            # 5. Valence (positivity/negativity)
            # Use spectral features to estimate mood
            spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
            valence_score = np.mean(spectral_rolloff) / (sr / 2)  # Normalize
            features['valence'] = float(np.clip(valence_score, 0, 1))
            
            # 6. Genre detection (simplified - based on tempo, energy, and spectral features)
            features['genre'] = self._detect_genre(features)
            
            # 7. Mood detection
            features['mood'] = self._detect_mood(features)
            
            # 8. Instrumentation (simplified detection)
            features['instrumentation'] = self._detect_instruments(y, sr)
            
            # 9. Song structure
            features['structure'] = self._analyze_structure(y, sr, beats)
            
            logger.info(f"Audio analysis complete: {features}")
            return features
            
        except Exception as e:
            logger.error(f"Error analyzing audio: {e}", exc_info=True)
            # Return default features if analysis fails
            return self._get_default_features()
    
    def _detect_genre(self, features: Dict) -> str:
        """Detect genre based on musical features"""
        tempo = features.get('tempo', 120)
        energy = features.get('energy', 0.5)
        danceability = features.get('danceability', 0.5)
        
        if tempo > 140 and energy > 0.7:
            return "electronic" if danceability > 0.6 else "rock"
        elif tempo > 120 and energy > 0.6:
            return "pop" if danceability > 0.6 else "alternative"
        elif tempo > 90 and energy > 0.5:
            return "indie" if danceability > 0.5 else "folk"
        elif tempo < 90:
            return "ballad" if energy < 0.4 else "slow rock"
        else:
            return "pop"
    
    def _detect_mood(self, features: Dict) -> str:
        """Detect mood based on musical features"""
        valence = features.get('valence', 0.5)
        energy = features.get('energy', 0.5)
        mode = features.get('mode', 'major')
        
        if valence > 0.7 and energy > 0.6:
            return "upbeat" if mode == 'major' else "energetic"
        elif valence > 0.5 and energy > 0.5:
            return "happy" if mode == 'major' else "melancholic"
        elif valence < 0.4 and energy < 0.4:
            return "sad" if mode == 'minor' else "calm"
        elif energy > 0.7:
            return "intense"
        else:
            return "neutral"
    
    def _detect_instruments(self, y: np.ndarray, sr: int) -> List[str]:
        """Detect likely instruments in the audio"""
        instruments = []
        
        # Analyze frequency content
        spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
        spectral_rolloff = np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr))
        zero_crossing_rate = np.mean(librosa.feature.zero_crossing_rate(y))
        
        # Simple heuristics for instrument detection
        if spectral_centroid > 3000:
            instruments.append("drums")
        if spectral_rolloff > sr * 0.3:
            instruments.append("guitar")
        if zero_crossing_rate > 0.1:
            instruments.append("vocals")
        if spectral_centroid < 1000:
            instruments.append("bass")
        
        # Always include common instruments
        if not instruments:
            instruments = ["drums", "guitar", "bass", "vocals"]
        
        return instruments
    
    def _analyze_structure(self, y: np.ndarray, sr: int, beats: np.ndarray) -> Dict:
        """Analyze song structure (verse, chorus, etc.)"""
        # Simplified structure analysis
        duration = len(y) / sr
        
        # Estimate sections based on energy changes
        rms = librosa.feature.rms(y=y)[0]
        energy_changes = np.diff(rms)
        change_points = np.where(np.abs(energy_changes) > np.std(energy_changes) * 2)[0]
        
        structure = {
            "duration": float(duration),
            "sections": len(change_points) + 1,
            "has_intro": duration > 10,
            "has_outro": duration > 20
        }
        
        return structure
    
    def _get_default_features(self) -> Dict:
        """Return default features if analysis fails"""
        return {
            "tempo": 120.0,
            "key": "C",
            "mode": "major",
            "energy": 0.5,
            "danceability": 0.5,
            "valence": 0.5,
            "genre": "pop",
            "mood": "neutral",
            "instrumentation": ["drums", "guitar", "bass", "vocals"],
            "structure": {
                "duration": 30.0,
                "sections": 3,
                "has_intro": False,
                "has_outro": False
            }
        }
    
    def features_to_prompt(self, features: Dict, reference_song: Optional[str] = None) -> str:
        """
        Convert extracted features to a MusicGen prompt
        
        Args:
            features: Extracted audio features
            reference_song: Optional reference song name/artist
        
        Returns:
            Formatted prompt string for MusicGen
        """
        prompt_parts = []
        
        if reference_song:
            prompt_parts.append(f"in the style of {reference_song}")
        
        # Add genre
        genre = features.get('genre', 'pop')
        prompt_parts.append(f"{genre} genre")
        
        # Add mood
        mood = features.get('mood', 'neutral')
        prompt_parts.append(f"{mood} mood")
        
        # Add tempo
        tempo = features.get('tempo', 120)
        prompt_parts.append(f"{int(tempo)} BPM")
        
        # Add key and mode
        key = features.get('key', 'C')
        mode = features.get('mode', 'major')
        prompt_parts.append(f"{key} {mode}")
        
        # Add instrumentation
        instruments = features.get('instrumentation', [])
        if instruments:
            prompt_parts.append(f"with {', '.join(instruments)}")
        
        # Add energy level
        energy = features.get('energy', 0.5)
        if energy > 0.7:
            prompt_parts.append("high energy")
        elif energy < 0.3:
            prompt_parts.append("low energy")
        
        # Add danceability
        danceability = features.get('danceability', 0.5)
        if danceability > 0.7:
            prompt_parts.append("danceable")
        
        return ", ".join(prompt_parts)

# Global instance
_audio_analyzer: Optional[AudioAnalyzer] = None

def get_audio_analyzer() -> AudioAnalyzer:
    """Get or create the global audio analyzer instance"""
    global _audio_analyzer
    if _audio_analyzer is None:
        _audio_analyzer = AudioAnalyzer()
    return _audio_analyzer

