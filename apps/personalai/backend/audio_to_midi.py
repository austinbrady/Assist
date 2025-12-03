"""
Audio to MIDI Transcription System
Converts uploaded audio files to MIDI by analyzing the music and extracting notes, tempo, and structure
"""

import librosa
import numpy as np
import mido
from mido import MidiFile, MidiTrack, Message, MetaMessage
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import logging
from scipy import signal
from scipy.signal import find_peaks

logger = logging.getLogger(__name__)

class AudioToMIDI:
    """Convert audio files to MIDI by transcribing musical content"""
    
    def __init__(self):
        self.sample_rate = 22050
        self.hop_length = 512
        self.n_fft = 2048
        
    def transcribe_audio_to_midi(
        self,
        audio_path: Path,
        output_path: Path,
        tempo: Optional[float] = None,
        separate_tracks: bool = True
    ) -> Path:
        """
        Transcribe audio file to MIDI
        
        Args:
            audio_path: Path to input audio file
            output_path: Path to save MIDI file
            tempo: Optional tempo override (if None, will be detected)
            separate_tracks: Whether to separate into different instrument tracks
        
        Returns:
            Path to generated MIDI file
        """
        try:
            logger.info(f"Transcribing audio to MIDI: {audio_path}")
            
            # Load audio
            y, sr = librosa.load(str(audio_path), sr=self.sample_rate)
            duration = len(y) / sr
            
            # Detect tempo if not provided
            if tempo is None:
                tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
                tempo = float(tempo)
            
            logger.info(f"Detected tempo: {tempo} BPM")
            
            # Create MIDI file
            mid = MidiFile()
            ticks_per_beat = 480
            
            # Calculate ticks per second
            ticks_per_second = (tempo / 60) * ticks_per_beat
            
            if separate_tracks:
                # Separate tracks for different frequency ranges (instruments)
                tracks = self._create_separated_tracks(y, sr, tempo, ticks_per_second)
            else:
                # Single track with all notes
                tracks = [self._create_single_track(y, sr, tempo, ticks_per_second)]
            
            # Add tracks to MIDI file
            for track in tracks:
                mid.tracks.append(track)
            
            # Set tempo and time signature in first track
            if mid.tracks:
                mid.tracks[0].insert(0, MetaMessage(
                    'set_tempo',
                    tempo=mido.bpm2tempo(tempo),
                    time=0
                ))
                mid.tracks[0].insert(1, MetaMessage(
                    'time_signature',
                    numerator=4,
                    denominator=4,
                    time=0
                ))
            
            # Save MIDI file
            output_path.parent.mkdir(parents=True, exist_ok=True)
            mid.save(str(output_path))
            
            logger.info(f"MIDI transcription complete: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Error transcribing audio to MIDI: {e}", exc_info=True)
            raise
    
    def _create_single_track(
        self,
        y: np.ndarray,
        sr: int,
        tempo: float,
        ticks_per_second: float
    ) -> MidiTrack:
        """Create a single MIDI track from audio"""
        track = MidiTrack()
        track.append(MetaMessage('track_name', name='Transcribed Audio', time=0))
        track.append(Message('program_change', channel=0, program=0, time=0))  # Piano
        
        # Extract pitch content using chroma
        chroma = librosa.feature.chroma_stft(y=y, sr=sr, hop_length=self.hop_length)
        
        # Extract onset times
        onset_frames = librosa.onset.onset_detect(y=y, sr=sr, hop_length=self.hop_length)
        onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=self.hop_length)
        
        # Extract notes from chroma
        notes = self._extract_notes_from_chroma(chroma, onset_times, ticks_per_second)
        
        # Add notes to track
        last_time = 0
        for i, note_data in enumerate(notes):
            current_time = int(note_data['time'] * ticks_per_second)
            time_delta = current_time - last_time
            
            track.append(Message(
                'note_on',
                channel=0,
                note=note_data['note'],
                velocity=note_data['velocity'],
                time=time_delta if i == 0 or time_delta > 0 else 0
            ))
            
            duration_ticks = int(note_data['duration'] * ticks_per_second)
            track.append(Message(
                'note_off',
                channel=0,
                note=note_data['note'],
                velocity=0,
                time=duration_ticks
            ))
            
            last_time = current_time + duration_ticks
        
        return track
    
    def _create_separated_tracks(
        self,
        y: np.ndarray,
        sr: int,
        tempo: float,
        ticks_per_second: float
    ) -> List[MidiTrack]:
        """Create separate tracks for different frequency ranges (drums, bass, melody, harmony)"""
        tracks = []
        
        # Separate frequency bands
        # Low frequencies (bass) - 20-250 Hz
        # Mid frequencies (melody) - 250-2000 Hz
        # High frequencies (harmony/percussion) - 2000+ Hz
        
        # Use harmonic-percussive separation
        y_harmonic, y_percussive = librosa.effects.hpss(y)
        
        # Bass track (low frequencies)
        bass_track = self._create_frequency_track(
            y_harmonic, sr, tempo, ticks_per_second,
            freq_range=(20, 250), channel=2, program=32, name="Bass"
        )
        if bass_track:
            tracks.append(bass_track)
        
        # Melody track (mid frequencies)
        melody_track = self._create_frequency_track(
            y_harmonic, sr, tempo, ticks_per_second,
            freq_range=(250, 2000), channel=0, program=0, name="Melody"
        )
        if melody_track:
            tracks.append(melody_track)
        
        # Harmony track (high frequencies)
        harmony_track = self._create_frequency_track(
            y_harmonic, sr, tempo, ticks_per_second,
            freq_range=(2000, sr//2), channel=1, program=24, name="Harmony"
        )
        if harmony_track:
            tracks.append(harmony_track)
        
        # Drums track (from percussive component)
        drums_track = self._create_drums_track(
            y_percussive, sr, tempo, ticks_per_second
        )
        if drums_track:
            tracks.append(drums_track)
        
        return tracks
    
    def _create_frequency_track(
        self,
        y: np.ndarray,
        sr: int,
        tempo: float,
        ticks_per_second: float,
        freq_range: Tuple[float, float],
        channel: int,
        program: int,
        name: str
    ) -> Optional[MidiTrack]:
        """Create a MIDI track for a specific frequency range"""
        try:
            # Filter to frequency range
            nyquist = sr / 2
            low = freq_range[0] / nyquist
            high = min(freq_range[1] / nyquist, 0.99)
            
            # Apply bandpass filter
            b, a = signal.butter(4, [low, high], btype='band')
            y_filtered = signal.filtfilt(b, a, y)
            
            # Extract chroma from filtered signal
            chroma = librosa.feature.chroma_stft(y=y_filtered, sr=sr, hop_length=self.hop_length)
            
            # Extract onset times
            onset_frames = librosa.onset.onset_detect(y=y_filtered, sr=sr, hop_length=self.hop_length)
            if len(onset_frames) == 0:
                return None
            
            onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=self.hop_length)
            
            # Extract notes
            notes = self._extract_notes_from_chroma(chroma, onset_times, ticks_per_second)
            
            if len(notes) == 0:
                return None
            
            # Create track
            track = MidiTrack()
            track.append(MetaMessage('track_name', name=name, time=0))
            track.append(Message('program_change', channel=channel, program=program, time=0))
            
            # Add notes
            last_time = 0
            for i, note_data in enumerate(notes):
                current_time = int(note_data['time'] * ticks_per_second)
                time_delta = current_time - last_time
                
                track.append(Message(
                    'note_on',
                    channel=channel,
                    note=note_data['note'],
                    velocity=note_data['velocity'],
                    time=time_delta if i == 0 or time_delta > 0 else 0
                ))
                
                duration_ticks = int(note_data['duration'] * ticks_per_second)
                track.append(Message(
                    'note_off',
                    channel=channel,
                    note=note_data['note'],
                    velocity=0,
                    time=duration_ticks
                ))
                
                last_time = current_time + duration_ticks
            
            return track
            
        except Exception as e:
            logger.warning(f"Error creating frequency track {name}: {e}")
            return None
    
    def _create_drums_track(
        self,
        y: np.ndarray,
        sr: int,
        tempo: float,
        ticks_per_second: float
    ) -> Optional[MidiTrack]:
        """Create drums track from percussive component"""
        try:
            # Detect onsets in percussive signal
            onset_frames = librosa.onset.onset_detect(
                y=y, sr=sr, hop_length=self.hop_length,
                delta=0.2, wait=0.1
            )
            
            if len(onset_frames) == 0:
                return None
            
            onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=self.hop_length)
            
            # Analyze energy in different frequency bands for drum classification
            # Low = kick, mid = snare, high = hi-hat
            rms = librosa.feature.rms(y=y, hop_length=self.hop_length)[0]
            
            # Create track
            track = MidiTrack()
            track.append(MetaMessage('track_name', name='Drums', time=0))
            track.append(Message('program_change', channel=9, program=0, time=0))  # Channel 9 = drums
            
            # Map onsets to drum notes based on energy
            # General MIDI drum notes (channel 9)
            DRUM_NOTES = {
                'kick': 36,      # C1
                'snare': 38,     # D1
                'hihat_closed': 42,  # F#1
                'hihat_open': 46,    # A#1
                'crash': 49,     # C#2
                'ride': 51,      # D#2
                'tom_high': 50,  # D2
                'tom_mid': 47,   # B1
                'tom_low': 43,   # G1
            }
            
            last_time = 0
            for i, onset_time in enumerate(onset_times):
                current_time = int(onset_time * ticks_per_second)
                time_delta = current_time - last_time
                
                # Determine drum type based on energy
                frame_idx = librosa.time_to_frames(onset_time, sr=sr, hop_length=self.hop_length)
                if frame_idx < len(rms):
                    energy = rms[frame_idx]
                    
                    # Classify based on energy level
                    if energy > np.percentile(rms, 75):
                        drum_note = DRUM_NOTES.get('kick', 36)
                    elif energy > np.percentile(rms, 50):
                        drum_note = DRUM_NOTES.get('snare', 38)
                    else:
                        drum_note = DRUM_NOTES.get('hihat_closed', 42)
                else:
                    drum_note = DRUM_NOTES.get('snare', 38)
                
                velocity = int(np.clip(energy * 127 * 10, 60, 127))
                
                track.append(Message(
                    'note_on',
                    channel=9,
                    note=drum_note,
                    velocity=velocity,
                    time=time_delta if i == 0 or time_delta > 0 else 0
                ))
                
                # Short duration for drums
                track.append(Message(
                    'note_off',
                    channel=9,
                    note=drum_note,
                    velocity=0,
                    time=int(0.1 * ticks_per_second)
                ))
                
                last_time = current_time + int(0.1 * ticks_per_second)
            
            return track
            
        except Exception as e:
            logger.warning(f"Error creating drums track: {e}")
            return None
    
    def _extract_notes_from_chroma(
        self,
        chroma: np.ndarray,
        onset_times: np.ndarray,
        ticks_per_second: float
    ) -> List[Dict]:
        """Extract MIDI notes from chroma features"""
        notes = []
        
        # Map chroma bins to MIDI note numbers (C=0, C#=1, ..., B=11)
        chroma_to_note = {
            0: 60,   # C4
            1: 61,   # C#4
            2: 62,   # D4
            3: 63,   # D#4
            4: 64,   # E4
            5: 65,   # F4
            6: 66,   # F#4
            7: 67,   # G4
            8: 68,   # G#4
            9: 69,   # A4
            10: 70,  # A#4
            11: 71,  # B4
        }
        
        # Convert onset times to frame indices
        frame_rate = chroma.shape[1] / (onset_times[-1] if len(onset_times) > 0 else 1)
        
        for i, onset_time in enumerate(onset_times):
            frame_idx = int(onset_time * frame_rate)
            if frame_idx >= chroma.shape[1]:
                continue
            
            # Get chroma vector at this frame
            chroma_vector = chroma[:, frame_idx]
            
            # Find dominant pitch class
            dominant_pitch = np.argmax(chroma_vector)
            chroma_strength = chroma_vector[dominant_pitch]
            
            # Only add note if chroma strength is significant
            if chroma_strength > 0.3:
                base_note = chroma_to_note[dominant_pitch]
                
                # Determine octave based on overall energy
                # For simplicity, use middle octave (C4-C5 range)
                note_number = base_note
                
                # Calculate velocity from chroma strength
                velocity = int(np.clip(chroma_strength * 127, 60, 127))
                
                # Estimate duration (next onset or 0.5 seconds, whichever is shorter)
                if i < len(onset_times) - 1:
                    duration = min(onset_times[i + 1] - onset_time, 0.5)
                else:
                    duration = 0.5
                
                notes.append({
                    'note': note_number,
                    'velocity': velocity,
                    'time': onset_time,
                    'duration': duration
                })
        
        return notes

# Global instance
_audio_to_midi: Optional[AudioToMIDI] = None

def get_audio_to_midi() -> AudioToMIDI:
    """Get or create the global audio-to-MIDI converter instance"""
    global _audio_to_midi
    if _audio_to_midi is None:
        _audio_to_midi = AudioToMIDI()
    return _audio_to_midi

