"""
Advanced MIDI Generation System
Generates professional multi-track MIDI files for DAW import
"""

import mido
from mido import MidiFile, MidiTrack, Message, MetaMessage
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import logging
import json
import random
import math

logger = logging.getLogger(__name__)

# Standard MIDI Drum Mapping (GM - General MIDI)
DRUM_MAP = {
    # Kick Drums
    "C1": "Kick 1 (Acoustic)",
    "C#1": "Kick 2 (Rimshot)",
    "D1": "Snare 1 (Acoustic)",
    "D#1": "Snare 2 (Rimshot)",
    "E1": "Snare 3 (Side Stick)",
    
    # Hi-Hats
    "F#1": "Hi-Hat Closed",
    "G#1": "Hi-Hat Pedal",
    "A#1": "Hi-Hat Open",
    
    # Cymbals
    "C2": "Crash 1",
    "C#2": "Crash 2",
    "D2": "Ride 1",
    "D#2": "Ride 2 (Bell)",
    "E2": "Ride 3 (Edge)",
    
    # Toms
    "F2": "Tom 1 (High)",
    "F#2": "Tom 2 (High-Mid)",
    "G2": "Tom 3 (Low-Mid)",
    "G#2": "Tom 4 (Low)",
    "A2": "Tom 5 (Floor)",
    "A#2": "Tom 6 (Floor)",
    
    # Percussion
    "B2": "Tambourine",
    "C3": "Shaker",
    "C#3": "Cowbell",
    "D3": "Triangle",
    "D#3": "Wood Block",
    "E3": "Clap",
    "F3": "Snap",
}

# MIDI Note Numbers for Drums
DRUM_NOTES = {
    "kick": 36,  # C1
    "snare": 38,  # D1
    "hihat_closed": 42,  # F#1
    "hihat_open": 46,  # A#1
    "crash": 49,  # C2
    "ride": 51,  # D2
    "tom_high": 48,  # C2
    "tom_mid": 47,  # B1
    "tom_low": 43,  # G1
}

class MIDIGenerator:
    """Generate professional multi-track MIDI files"""
    
    def __init__(self, tempo: int = 120, time_signature: Tuple[int, int] = (4, 4)):
        """
        Initialize MIDI generator
        
        Args:
            tempo: BPM (beats per minute)
            time_signature: (numerator, denominator) e.g., (4, 4) for 4/4 time
        """
        self.tempo = tempo
        self.time_signature = time_signature
        self.mid = MidiFile()
        self.tracks = {}
        self.current_time = 0
        self.ticks_per_beat = 480  # Standard MIDI resolution
        
        # Calculate ticks per quarter note based on tempo
        self.ticks_per_quarter = self.ticks_per_beat
        
    def _get_track(self, track_name: str) -> MidiTrack:
        """Get or create a track"""
        if track_name not in self.tracks:
            track = MidiTrack()
            self.mid.tracks.append(track)
            self.tracks[track_name] = track
            
            # Set track name
            track.append(MetaMessage('track_name', name=track_name, time=0))
            
            # Set instrument (program change)
            if track_name == "Drums":
                # Channel 9 is reserved for drums in GM
                track.append(Message('program_change', channel=9, program=0, time=0))
            else:
                # Assign channel based on track
                channel = self._get_channel_for_track(track_name)
                program = self._get_program_for_track(track_name)
                track.append(Message('program_change', channel=channel, program=program, time=0))
        
        return self.tracks[track_name]
    
    def _get_channel_for_track(self, track_name: str) -> int:
        """Get MIDI channel for track (0-15, 9 is reserved for drums)"""
        channel_map = {
            "Drums": 9,
            "Piano": 0,
            "Guitar": 1,
            "Bass": 2,
            "Vocals": 3,
            "Production": 4,
            "Synthesizer": 5,
            "Bass Drop": 6,
            "Group Vocals": 7,
        }
        return channel_map.get(track_name, 8)
    
    def _get_program_for_track(self, track_name: str) -> int:
        """Get MIDI program (instrument) number for track"""
        program_map = {
            "Piano": 0,  # Acoustic Grand Piano
            "Guitar": 24,  # Acoustic Guitar (nylon)
            "Bass": 32,  # Acoustic Bass
            "Vocals": 53,  # Voice Oohs
            "Production": 80,  # Lead 1 (square)
            "Synthesizer": 81,  # Lead 2 (sawtooth)
            "Bass Drop": 33,  # Electric Bass (finger)
            "Group Vocals": 53,  # Voice Oohs
        }
        return program_map.get(track_name, 0)
    
    def add_drum_track(
        self,
        pattern: Optional[Dict] = None,
        duration_seconds: float = 30,
        complexity: str = "medium"
    ):
        """
        Add drum track with proper mapping
        
        Args:
            pattern: Optional custom pattern dict
            duration_seconds: Duration of the track
            complexity: "simple", "medium", "complex"
        """
        track = self._get_track("Drums")
        ticks_per_second = (self.tempo / 60) * self.ticks_per_beat
        
        if pattern is None:
            pattern = self._generate_drum_pattern(duration_seconds, complexity)
        
        last_time = 0
        for i, beat_data in enumerate(pattern):
            current_time = int(beat_data['time'] * ticks_per_second)
            time_delta = current_time - last_time
            
            for note_name, velocity in beat_data['notes'].items():
                if note_name in DRUM_NOTES:
                    note_number = DRUM_NOTES[note_name]
                    track.append(Message(
                        'note_on',
                        channel=9,
                        note=note_number,
                        velocity=velocity,
                        time=time_delta if i == 0 or time_delta > 0 else 0
                    ))
                    # Note off after short duration
                    track.append(Message(
                        'note_off',
                        channel=9,
                        note=note_number,
                        velocity=0,
                        time=int(0.1 * ticks_per_second)
                    ))
            
            last_time = current_time
        
        logger.info(f"Added drum track with {len(pattern)} beats")
    
    def _generate_drum_pattern(self, duration: float, complexity: str) -> List[Dict]:
        """Generate drum pattern based on complexity"""
        beats_per_second = self.tempo / 60
        total_beats = int(duration * beats_per_second)
        pattern = []
        
        if complexity == "simple":
            # Simple 4/4 pattern
            for i in range(total_beats):
                beat_data = {'time': 1 / beats_per_second, 'notes': {}}
                
                if i % 4 == 0:  # Kick on 1
                    beat_data['notes']['kick'] = 100
                if i % 4 == 2:  # Snare on 3
                    beat_data['notes']['snare'] = 90
                if i % 2 == 1:  # Hi-hat on off-beats
                    beat_data['notes']['hihat_closed'] = 70
                
                pattern.append(beat_data)
        
        elif complexity == "medium":
            # More varied pattern
            for i in range(total_beats):
                beat_data = {'time': 1 / beats_per_second, 'notes': {}}
                
                # Kick pattern
                if i % 4 == 0 or (i % 8 == 3):
                    beat_data['notes']['kick'] = 100
                
                # Snare pattern
                if i % 4 == 2:
                    beat_data['notes']['snare'] = 90
                
                # Hi-hat pattern
                if i % 2 == 1:
                    beat_data['notes']['hihat_closed'] = 70
                elif i % 8 == 7:
                    beat_data['notes']['hihat_open'] = 80
                
                # Occasional crash
                if i % 16 == 0:
                    beat_data['notes']['crash'] = 100
                
                pattern.append(beat_data)
        
        else:  # complex
            # Complex pattern with fills
            for i in range(total_beats):
                beat_data = {'time': 1 / beats_per_second, 'notes': {}}
                
                # Kick pattern (more varied)
                if i % 4 == 0:
                    beat_data['notes']['kick'] = 100
                elif i % 8 == 3:
                    beat_data['notes']['kick'] = 90
                elif i % 16 == 11:
                    beat_data['notes']['kick'] = 85
                
                # Snare pattern
                if i % 4 == 2:
                    beat_data['notes']['snare'] = 90
                elif i % 16 == 14:
                    beat_data['notes']['snare'] = 80
                
                # Hi-hat pattern
                if i % 2 == 1:
                    beat_data['notes']['hihat_closed'] = 70
                elif i % 8 == 7:
                    beat_data['notes']['hihat_open'] = 80
                
                # Toms for fills
                if i % 16 >= 12:
                    if i % 2 == 0:
                        beat_data['notes']['tom_high'] = 75
                    else:
                        beat_data['notes']['tom_mid'] = 75
                
                # Crash accents
                if i % 16 == 0:
                    beat_data['notes']['crash'] = 100
                elif i % 8 == 4:
                    beat_data['notes']['ride'] = 85
                
                pattern.append(beat_data)
        
        return pattern
    
    def add_piano_track(
        self,
        chord_progression: Optional[List[str]] = None,
        duration_seconds: float = 30,
        style: str = "arpeggiated"
    ):
        """Add piano track with chords or melody"""
        track = self._get_track("Piano")
        ticks_per_second = (self.tempo / 60) * self.ticks_per_beat
        
        if chord_progression is None:
            chord_progression = self._generate_chord_progression(duration_seconds)
        
        current_tick = 0
        beat_duration = 60 / self.tempo  # Duration of one beat in seconds
        
        for i, chord_data in enumerate(chord_progression):
            chord_notes = chord_data['notes']
            duration = chord_data.get('duration', beat_duration * 4)  # Default to 4 beats
            
            tick_delay = int((duration if i == 0 else duration) * ticks_per_second)
            
            if style == "arpeggiated":
                # Play notes in sequence
                note_delay = int((duration / len(chord_notes)) * ticks_per_second)
                for j, note in enumerate(chord_notes):
                    track.append(Message(
                        'note_on',
                        channel=0,
                        note=note,
                        velocity=80,
                        time=tick_delay if (i == 0 and j == 0) else note_delay
                    ))
                    track.append(Message(
                        'note_off',
                        channel=0,
                        note=note,
                        velocity=0,
                        time=int(duration * ticks_per_second)
                    ))
            else:  # block chords
                # Play all notes together
                for note in chord_notes:
                    track.append(Message(
                        'note_on',
                        channel=0,
                        note=note,
                        velocity=80,
                        time=tick_delay if chord_notes.index(note) == 0 else 0
                    ))
                # Note off after duration
                for note in chord_notes:
                    track.append(Message(
                        'note_off',
                        channel=0,
                        note=note,
                        velocity=0,
                        time=int(duration * ticks_per_second)
                    ))
        
        logger.info(f"Added piano track with {len(chord_progression)} chords")
    
    def add_guitar_track(
        self,
        pattern: Optional[List[Dict]] = None,
        duration_seconds: float = 30,
        style: str = "rhythm"
    ):
        """Add guitar track"""
        track = self._get_track("Guitar")
        ticks_per_second = (self.tempo / 60) * self.ticks_per_beat
        
        if pattern is None:
            pattern = self._generate_guitar_pattern(duration_seconds, style)
        
        last_time = 0
        for i, note_data in enumerate(pattern):
            current_time = int(note_data['time'] * ticks_per_second)
            time_delta = current_time - last_time
            
            track.append(Message(
                'note_on',
                channel=1,
                note=note_data['note'],
                velocity=note_data.get('velocity', 90),
                time=time_delta if i == 0 or time_delta > 0 else 0
            ))
            track.append(Message(
                'note_off',
                channel=1,
                note=note_data['note'],
                velocity=0,
                time=int(note_data.get('duration', 0.5) * ticks_per_second)
            ))
            
            last_time = current_time
        
        logger.info(f"Added guitar track with {len(pattern)} notes")
    
    def add_bass_track(
        self,
        pattern: Optional[List[Dict]] = None,
        duration_seconds: float = 30,
        style: str = "walking"
    ):
        """Add bass track"""
        track = self._get_track("Bass")
        ticks_per_second = (self.tempo / 60) * self.ticks_per_beat
        
        if pattern is None:
            pattern = self._generate_bass_pattern(duration_seconds, style)
        
        last_time = 0
        for i, note_data in enumerate(pattern):
            current_time = int(note_data['time'] * ticks_per_second)
            time_delta = current_time - last_time
            
            track.append(Message(
                'note_on',
                channel=2,
                note=note_data['note'],
                velocity=note_data.get('velocity', 100),
                time=time_delta if i == 0 or time_delta > 0 else 0
            ))
            track.append(Message(
                'note_off',
                channel=2,
                note=note_data['note'],
                velocity=0,
                time=int(note_data.get('duration', 0.5) * ticks_per_second)
            ))
            
            last_time = current_time
        
        logger.info(f"Added bass track with {len(pattern)} notes")
    
    def add_vocals_track(
        self,
        lyrics: str,
        melody: Optional[List[Dict]] = None,
        duration_seconds: float = 30
    ):
        """
        Add vocals track with lyrics
        
        Args:
            lyrics: Text lyrics for the song
            melody: Optional melody notes (list of dicts with 'note', 'time', 'duration')
            duration_seconds: Duration of the track
        """
        track = self._get_track("Vocals")
        ticks_per_second = (self.tempo / 60) * self.ticks_per_beat
        
        # Add lyrics as text events
        lyrics_lines = lyrics.split('\n')
        line_duration = duration_seconds / max(len(lyrics_lines), 1)
        
        for i, line in enumerate(lyrics_lines):
            if line.strip():
                time_position = int(i * line_duration * ticks_per_second)
                track.append(MetaMessage(
                    'text',
                    text=line.strip(),
                    time=time_position if i == 0 else int(line_duration * ticks_per_second)
                ))
        
        # Add melody if provided
        if melody:
            last_time = 0
            for i, note_data in enumerate(melody):
                current_time = int(note_data['time'] * ticks_per_second)
                time_delta = current_time - last_time
                
                track.append(Message(
                    'note_on',
                    channel=3,
                    note=note_data['note'],
                    velocity=note_data.get('velocity', 90),
                    time=time_delta if i == 0 or time_delta > 0 else 0
                ))
                track.append(Message(
                    'note_off',
                    channel=3,
                    note=note_data['note'],
                    velocity=0,
                    time=int(note_data.get('duration', 0.5) * ticks_per_second)
                ))
                last_time = current_time
        else:
            # Generate simple melody from lyrics
            melody = self._generate_vocal_melody(lyrics, duration_seconds)
            last_time = 0
            for i, note_data in enumerate(melody):
                current_time = int(note_data['time'] * ticks_per_second)
                time_delta = current_time - last_time
                track.append(Message(
                    'note_on',
                    channel=3,
                    note=note_data['note'],
                    velocity=90,
                    time=time_delta if i == 0 or time_delta > 0 else 0
                ))
                track.append(Message(
                    'note_off',
                    channel=3,
                    note=note_data['note'],
                    velocity=0,
                    time=int(note_data.get('duration', 0.5) * ticks_per_second)
                ))
                last_time = current_time
        
        logger.info(f"Added vocals track with {len(lyrics_lines)} lyric lines")
    
    def add_synthesizer_track(
        self,
        pattern: Optional[List[Dict]] = None,
        duration_seconds: float = 30,
        style: str = "lead"
    ):
        """Add synthesizer track"""
        track = self._get_track("Synthesizer")
        ticks_per_second = (self.tempo / 60) * self.ticks_per_beat
        
        if pattern is None:
            pattern = self._generate_synth_pattern(duration_seconds, style)
        
        last_time = 0
        for i, note_data in enumerate(pattern):
            current_time = int(note_data['time'] * ticks_per_second)
            time_delta = current_time - last_time
            
            track.append(Message(
                'note_on',
                channel=5,
                note=note_data['note'],
                velocity=note_data.get('velocity', 85),
                time=time_delta if i == 0 or time_delta > 0 else 0
            ))
            track.append(Message(
                'note_off',
                channel=5,
                note=note_data['note'],
                velocity=0,
                time=int(note_data.get('duration', 1.0) * ticks_per_second)
            ))
            
            last_time = current_time
        
        logger.info(f"Added synthesizer track with {len(pattern)} notes")
    
    def add_bass_drop_track(
        self,
        drop_times: Optional[List[float]] = None,
        duration_seconds: float = 30
    ):
        """Add bass drop track with low-frequency hits"""
        track = self._get_track("Bass Drop")
        ticks_per_second = (self.tempo / 60) * self.ticks_per_beat
        
        if drop_times is None:
            # Generate drops every 8 beats
            beats_per_drop = 8
            drop_interval = (60 / self.tempo) * beats_per_drop
            drop_times = [i * drop_interval for i in range(int(duration_seconds / drop_interval))]
        
        last_time = 0
        for i, drop_time in enumerate(drop_times):
            current_time = int(drop_time * ticks_per_second)
            time_delta = current_time - last_time
            
            # Low bass note (C2 = 36, but we'll use even lower)
            bass_note = 24  # C1 - very low
            
            track.append(Message(
                'note_on',
                channel=6,
                note=bass_note,
                velocity=127,  # Maximum velocity for impact
                time=time_delta if i == 0 or time_delta > 0 else 0
            ))
            # Hold for longer duration
            track.append(Message(
                'note_off',
                channel=6,
                note=bass_note,
                velocity=0,
                time=int(1.0 * ticks_per_second)  # Hold for 1 second
            ))
            
            last_time = current_time + int(1.0 * ticks_per_second)
        
        logger.info(f"Added bass drop track with {len(drop_times)} drops")
    
    def add_group_vocals_track(
        self,
        lyrics: str,
        harmony_notes: Optional[List[Dict]] = None,
        duration_seconds: float = 30
    ):
        """Add group vocals/harmony track"""
        track = self._get_track("Group Vocals")
        ticks_per_second = (self.tempo / 60) * self.ticks_per_beat
        
        if harmony_notes is None:
            harmony_notes = self._generate_harmony(lyrics, duration_seconds)
        
        last_time = 0
        for i, note_data in enumerate(harmony_notes):
            current_time = int(note_data['time'] * ticks_per_second)
            time_delta = current_time - last_time
            
            track.append(Message(
                'note_on',
                channel=7,
                note=note_data['note'],
                velocity=note_data.get('velocity', 80),
                time=time_delta if i == 0 or time_delta > 0 else 0
            ))
            track.append(Message(
                'note_off',
                channel=7,
                note=note_data['note'],
                velocity=0,
                time=int(note_data.get('duration', 0.5) * ticks_per_second)
            ))
            
            last_time = current_time
        
        logger.info(f"Added group vocals track with {len(harmony_notes)} harmony notes")
    
    def add_production_track(
        self,
        effects: Optional[List[Dict]] = None,
        duration_seconds: float = 30
    ):
        """Add production/effects track"""
        track = self._get_track("Production")
        ticks_per_second = (self.tempo / 60) * self.ticks_per_beat
        
        if effects is None:
            effects = self._generate_production_effects(duration_seconds)
        
        last_time = 0
        for i, effect_data in enumerate(effects):
            current_time = int(effect_data['time'] * ticks_per_second)
            time_delta = current_time - last_time
            
            # Use control change messages for effects
            if 'cc_number' in effect_data and 'cc_value' in effect_data:
                track.append(Message(
                    'control_change',
                    channel=4,
                    control=effect_data['cc_number'],
                    value=effect_data['cc_value'],
                    time=time_delta if i == 0 or time_delta > 0 else 0
                ))
            
            last_time = current_time
        
        logger.info(f"Added production track with {len(effects)} effects")
    
    def _generate_chord_progression(self, duration: float) -> List[Dict]:
        """Generate chord progression"""
        # Common progressions
        progressions = [
            # I-V-vi-IV (C-G-Am-F)
            [60, 64, 67],  # C major
            [67, 71, 74],  # G major
            [57, 60, 64],  # A minor
            [65, 69, 72],  # F major
        ]
        
        beat_duration = 60 / self.tempo
        beats_per_chord = 4
        chord_duration = beat_duration * beats_per_chord
        num_chords = int(duration / chord_duration)
        
        progression = []
        for i in range(num_chords):
            chord_idx = i % len(progressions)
            progression.append({
                'notes': progressions[chord_idx],
                'duration': chord_duration
            })
        
        return progression
    
    def _generate_guitar_pattern(self, duration: float, style: str) -> List[Dict]:
        """Generate guitar pattern"""
        beat_duration = 60 / self.tempo
        pattern = []
        
        if style == "rhythm":
            # Strumming pattern
            for i in range(int(duration / beat_duration)):
                if i % 2 == 0:  # Downstroke
                    pattern.append({
                        'note': 60 + (i % 4),  # Vary note slightly
                        'time': i * beat_duration,
                        'duration': beat_duration * 0.8,
                        'velocity': 90
                    })
        else:  # lead
            # Melodic pattern
            scale_notes = [60, 62, 64, 65, 67, 69, 71, 72]  # C major scale
            for i in range(int(duration / (beat_duration * 2))):
                pattern.append({
                    'note': scale_notes[i % len(scale_notes)],
                    'time': i * beat_duration * 2,
                    'duration': beat_duration * 1.5,
                    'velocity': 85
                })
        
        return pattern
    
    def _generate_bass_pattern(self, duration: float, style: str) -> List[Dict]:
        """Generate bass pattern"""
        beat_duration = 60 / self.tempo
        pattern = []
        
        # Root notes of chords (simplified)
        root_notes = [36, 43, 40, 41]  # C, G, E, F (octave 2-3)
        
        for i in range(int(duration / beat_duration)):
            note_idx = (i // 4) % len(root_notes)
            pattern.append({
                'note': root_notes[note_idx],
                'time': i * beat_duration,
                'duration': beat_duration * 0.9,
                'velocity': 100
            })
        
        return pattern
    
    def _generate_vocal_melody(self, lyrics: str, duration: float) -> List[Dict]:
        """Generate simple vocal melody from lyrics"""
        beat_duration = 60 / self.tempo
        words = lyrics.split()
        notes_per_word = 2
        total_notes = len(words) * notes_per_word
        
        if total_notes == 0:
            return []
        
        note_duration = duration / total_notes
        melody_notes = [60, 62, 64, 65, 67, 69, 71, 72]  # C major scale
        
        melody = []
        for i in range(total_notes):
            melody.append({
                'note': melody_notes[i % len(melody_notes)],
                'time': i * note_duration,
                'duration': note_duration * 0.9,
                'velocity': 90
            })
        
        return melody
    
    def _generate_synth_pattern(self, duration: float, style: str) -> List[Dict]:
        """Generate synthesizer pattern"""
        beat_duration = 60 / self.tempo
        pattern = []
        
        if style == "lead":
            # Melodic lead
            scale_notes = [72, 74, 76, 77, 79, 81, 83, 84]  # C major scale (octave 5)
            for i in range(int(duration / (beat_duration * 2))):
                pattern.append({
                    'note': scale_notes[i % len(scale_notes)],
                    'time': i * beat_duration * 2,
                    'duration': beat_duration * 1.8,
                    'velocity': 85
                })
        else:  # pad
            # Sustained pad chords
            chord_notes = [60, 64, 67]  # C major
            for i in range(int(duration / (beat_duration * 8))):
                for note in chord_notes:
                    pattern.append({
                        'note': note + 12,  # Octave up
                        'time': i * beat_duration * 8,
                        'duration': beat_duration * 7,
                        'velocity': 70
                    })
        
        return pattern
    
    def _generate_harmony(self, lyrics: str, duration: float) -> List[Dict]:
        """Generate harmony notes (typically 3rd or 5th above melody)"""
        melody = self._generate_vocal_melody(lyrics, duration)
        harmony = []
        
        for note_data in melody:
            # Add 4 semitones (major 3rd) for harmony
            harmony_note = note_data['note'] + 4
            harmony.append({
                'note': harmony_note,
                'time': note_data['time'],
                'duration': note_data['duration'],
                'velocity': 75  # Slightly quieter
            })
        
        return harmony
    
    def _generate_production_effects(self, duration: float) -> List[Dict]:
        """Generate production effects (reverb, delay, etc.)"""
        beat_duration = 60 / self.tempo
        effects = []
        
        # Add reverb at key moments
        for i in range(int(duration / (beat_duration * 16))):
            effects.append({
                'time': i * beat_duration * 16,
                'cc_number': 91,  # Reverb
                'cc_value': 64 + random.randint(-10, 10)
            })
        
        return effects
    
    def set_tempo(self, tempo: int):
        """Set tempo in BPM"""
        self.tempo = tempo
        # Add tempo change meta message
        tempo_midi = mido.bpm2tempo(tempo)
        for track in self.mid.tracks:
            if track:
                track.insert(0, MetaMessage('set_tempo', tempo=tempo_midi, time=0))
    
    def set_time_signature(self, numerator: int, denominator: int):
        """Set time signature"""
        self.time_signature = (numerator, denominator)
        # Add time signature meta message
        for track in self.mid.tracks:
            if track:
                track.insert(0, MetaMessage(
                    'time_signature',
                    numerator=numerator,
                    denominator=denominator,
                    time=0
                ))
    
    def save(self, filepath: Path) -> Path:
        """Save MIDI file"""
        # Set tempo and time signature in first track
        if self.mid.tracks:
            self.mid.tracks[0].insert(0, MetaMessage(
                'set_tempo',
                tempo=mido.bpm2tempo(self.tempo),
                time=0
            ))
            self.mid.tracks[0].insert(1, MetaMessage(
                'time_signature',
                numerator=self.time_signature[0],
                denominator=self.time_signature[1],
                time=0
            ))
        
        self.mid.save(str(filepath))
        logger.info(f"Saved MIDI file to {filepath}")
        return filepath
    
    def get_drum_map(self) -> Dict[str, str]:
        """Get drum mapping documentation"""
        return DRUM_MAP
    
    def export_drum_map_documentation(self, filepath: Path) -> Path:
        """Export drum map as JSON documentation"""
        doc = {
            "drum_map": DRUM_MAP,
            "drum_notes": DRUM_NOTES,
            "description": "General MIDI (GM) Standard Drum Map",
            "note": "Channel 9 is reserved for percussion in General MIDI standard"
        }
        
        with open(filepath, 'w') as f:
            json.dump(doc, f, indent=2)
        
        logger.info(f"Exported drum map documentation to {filepath}")
        return filepath

# Global instance
_midi_generator: Optional[MIDIGenerator] = None

def get_midi_generator(tempo: int = 120) -> MIDIGenerator:
    """Get or create MIDI generator instance"""
    global _midi_generator
    if _midi_generator is None or _midi_generator.tempo != tempo:
        _midi_generator = MIDIGenerator(tempo=tempo)
    return _midi_generator

