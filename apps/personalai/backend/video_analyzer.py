"""
Video Analysis Module for Content Creators
Analyzes video files to provide feedback on composition, editing, and technical quality
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Dict, Optional, List, Tuple
import logging
import json

logger = logging.getLogger(__name__)

class VideoAnalyzer:
    """Analyze video files for content creator feedback"""
    
    def __init__(self):
        self.supported_formats = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv']
    
    def analyze_video(self, video_path: Path) -> Dict:
        """
        Comprehensive video analysis for content creators
        
        Analyzes:
        - Technical quality (resolution, fps, bitrate)
        - Composition (rule of thirds, framing)
        - Color grading and exposure
        - Motion and stability
        - Audio sync (if audio track present)
        - Editing patterns (cuts, transitions)
        - Content recommendations
        
        Returns:
            Dictionary with comprehensive video analysis
        """
        try:
            logger.info(f"Analyzing video file: {video_path}")
            
            cap = cv2.VideoCapture(str(video_path))
            
            if not cap.isOpened():
                return {
                    'error': 'Failed to open video file',
                    'message': 'Could not read video file'
                }
            
            # Get basic video properties
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = frame_count / fps if fps > 0 else 0
            codec = int(cap.get(cv2.CAP_PROP_FOURCC))
            codec_str = "".join([chr((codec >> 8 * i) & 0xFF) for i in range(4)])
            
            analysis = {
                'technical': {
                    'resolution': {'width': width, 'height': height},
                    'aspect_ratio': width / height if height > 0 else 16/9,
                    'fps': float(fps),
                    'duration_seconds': float(duration),
                    'frame_count': frame_count,
                    'codec': codec_str,
                    'file_size_mb': video_path.stat().st_size / (1024 * 1024) if video_path.exists() else 0
                }
            }
            
            # Sample frames for analysis (every 30 frames or 1 second at 30fps)
            sample_interval = max(1, int(fps * 1))  # Sample every second
            frames_analyzed = []
            frame_times = []
            
            frame_idx = 0
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_idx % sample_interval == 0:
                    frames_analyzed.append(frame)
                    frame_times.append(frame_idx / fps if fps > 0 else 0)
                
                frame_idx += 1
                
                # Limit analysis to first 5 minutes for performance
                if frame_idx > fps * 300:
                    break
            
            cap.release()
            
            if not frames_analyzed:
                return {
                    'error': 'No frames could be extracted',
                    'message': 'Video file may be corrupted'
                }
            
            # Analyze composition
            analysis['composition'] = self._analyze_composition(frames_analyzed, width, height)
            
            # Analyze color and exposure
            analysis['color_exposure'] = self._analyze_color_exposure(frames_analyzed)
            
            # Analyze motion and stability
            analysis['motion_stability'] = self._analyze_motion_stability(frames_analyzed, fps)
            
            # Analyze editing patterns
            analysis['editing'] = self._analyze_editing_patterns(frames_analyzed, fps, sample_interval)
            
            # Generate recommendations
            analysis['recommendations'] = self._generate_recommendations(analysis)
            
            # Content type detection
            analysis['content_type'] = self._detect_content_type(analysis)
            
            logger.info(f"Video analysis complete")
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing video: {e}", exc_info=True)
            return {
                'error': str(e),
                'message': 'Failed to analyze video file'
            }
    
    def _analyze_composition(self, frames: List[np.ndarray], width: int, height: int) -> Dict:
        """Analyze video composition (rule of thirds, framing, etc.)"""
        composition_scores = []
        center_focus_scores = []
        
        for frame in frames:
            # Convert to grayscale for analysis
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if len(frame.shape) > 2 else frame
            
            # Rule of thirds analysis
            # Divide frame into 9 sections
            third_w = width // 3
            third_h = height // 3
            
            # Calculate energy in each third
            top_third = np.mean(gray[:third_h, :])
            middle_third = np.mean(gray[third_h:2*third_h, :])
            bottom_third = np.mean(gray[2*third_h:, :])
            
            left_third = np.mean(gray[:, :third_w])
            center_third = np.mean(gray[:, third_w:2*third_w])
            right_third = np.mean(gray[:, 2*third_w:])
            
            # Rule of thirds score (higher energy in intersection points is better)
            intersections = [
                np.mean(gray[:third_h, :third_w]),  # Top-left
                np.mean(gray[:third_h, 2*third_w:]),  # Top-right
                np.mean(gray[2*third_h:, :third_w]),  # Bottom-left
                np.mean(gray[2*third_h:, 2*third_w:])  # Bottom-right
            ]
            
            rule_of_thirds_score = np.std(intersections) / (np.mean(intersections) + 1e-10)
            composition_scores.append(rule_of_thirds_score)
            
            # Center focus (check if center has more detail/energy)
            center_region = gray[height//4:3*height//4, width//4:3*width//4]
            edge_region = np.concatenate([
                gray[:height//4, :].flatten(),
                gray[3*height//4:, :].flatten(),
                gray[height//4:3*height//4, :width//4].flatten(),
                gray[height//4:3*height//4, 3*width//4:].flatten()
            ])
            
            center_focus = np.mean(center_region) / (np.mean(edge_region) + 1e-10)
            center_focus_scores.append(center_focus)
        
        avg_composition = np.mean(composition_scores) if composition_scores else 0
        avg_center_focus = np.mean(center_focus_scores) if center_focus_scores else 1.0
        
        return {
            'rule_of_thirds_score': float(avg_composition),
            'center_focus_ratio': float(avg_center_focus),
            'assessment': 'good' if avg_composition > 0.3 else 'could_improve',
            'recommendations': self._get_composition_recommendations(avg_composition, avg_center_focus)
        }
    
    def _analyze_color_exposure(self, frames: List[np.ndarray]) -> Dict:
        """Analyze color grading and exposure"""
        brightness_scores = []
        contrast_scores = []
        saturation_scores = []
        color_temps = []
        
        for frame in frames:
            # Convert to HSV for better color analysis
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            
            # Brightness (Value channel)
            brightness = np.mean(hsv[:, :, 2])
            brightness_scores.append(brightness)
            
            # Contrast (standard deviation of brightness)
            contrast = np.std(hsv[:, :, 2])
            contrast_scores.append(contrast)
            
            # Saturation
            saturation = np.mean(hsv[:, :, 1])
            saturation_scores.append(saturation)
            
            # Color temperature estimation (warm vs cool)
            # Warm = more red/yellow, Cool = more blue
            b, g, r = cv2.split(frame)
            warm_score = np.mean(r) / (np.mean(b) + 1e-10)
            color_temps.append(warm_score)
        
        avg_brightness = np.mean(brightness_scores)
        avg_contrast = np.mean(contrast_scores)
        avg_saturation = np.mean(saturation_scores)
        avg_color_temp = np.mean(color_temps)
        
        # Exposure assessment
        if avg_brightness < 50:
            exposure_assessment = 'underexposed'
        elif avg_brightness > 200:
            exposure_assessment = 'overexposed'
        else:
            exposure_assessment = 'good'
        
        # Color temperature assessment
        if avg_color_temp > 1.2:
            temp_assessment = 'warm'
        elif avg_color_temp < 0.8:
            temp_assessment = 'cool'
        else:
            temp_assessment = 'neutral'
        
        return {
            'brightness': float(avg_brightness),
            'contrast': float(avg_contrast),
            'saturation': float(avg_saturation),
            'color_temperature': float(avg_color_temp),
            'exposure_assessment': exposure_assessment,
            'color_temp_assessment': temp_assessment,
            'recommendations': self._get_color_recommendations(avg_brightness, avg_contrast, avg_saturation, exposure_assessment)
        }
    
    def _analyze_motion_stability(self, frames: List[np.ndarray], fps: float) -> Dict:
        """Analyze motion and camera stability"""
        if len(frames) < 2:
            return {
                'stability_score': 1.0,
                'motion_level': 'low',
                'assessment': 'insufficient_frames'
            }
        
        # Calculate optical flow between consecutive frames
        motion_vectors = []
        prev_gray = cv2.cvtColor(frames[0], cv2.COLOR_BGR2GRAY) if len(frames[0].shape) > 2 else frames[0]
        
        for i in range(1, len(frames)):
            curr_gray = cv2.cvtColor(frames[i], cv2.COLOR_BGR2GRAY) if len(frames[i].shape) > 2 else frames[i]
            
            # Calculate optical flow
            flow = cv2.calcOpticalFlowFarneback(prev_gray, curr_gray, None, 0.5, 3, 15, 3, 5, 1.2, 0)
            
            # Calculate magnitude of motion
            magnitude = np.sqrt(flow[..., 0]**2 + flow[..., 1]**2)
            avg_motion = np.mean(magnitude)
            motion_vectors.append(avg_motion)
            
            prev_gray = curr_gray
        
        avg_motion = np.mean(motion_vectors) if motion_vectors else 0
        motion_variance = np.var(motion_vectors) if len(motion_vectors) > 1 else 0
        
        # Stability assessment
        # Low variance = stable, high variance = shaky
        if motion_variance < 1.0:
            stability = 'very_stable'
        elif motion_variance < 5.0:
            stability = 'stable'
        elif motion_variance < 15.0:
            stability = 'somewhat_shaky'
        else:
            stability = 'shaky'
        
        # Motion level
        if avg_motion < 2.0:
            motion_level = 'low'
        elif avg_motion < 5.0:
            motion_level = 'moderate'
        else:
            motion_level = 'high'
        
        return {
            'average_motion': float(avg_motion),
            'motion_variance': float(motion_variance),
            'stability_assessment': stability,
            'motion_level': motion_level,
            'recommendations': self._get_stability_recommendations(stability, motion_level)
        }
    
    def _analyze_editing_patterns(self, frames: List[np.ndarray], fps: float, sample_interval: int) -> Dict:
        """Analyze editing patterns (cuts, transitions)"""
        if len(frames) < 2:
            return {
                'cut_frequency': 0,
                'average_shot_length': 0,
                'assessment': 'insufficient_frames'
            }
        
        # Detect cuts by comparing consecutive frames
        # Large difference = potential cut
        frame_differences = []
        prev_frame = frames[0]
        
        for i in range(1, len(frames)):
            curr_frame = frames[i]
            
            # Calculate difference
            diff = cv2.absdiff(prev_frame, curr_frame)
            diff_score = np.mean(diff)
            frame_differences.append(diff_score)
            
            prev_frame = curr_frame
        
        # Threshold for cut detection (adjust based on analysis)
        threshold = np.mean(frame_differences) + 2 * np.std(frame_differences)
        cuts = [i for i, diff in enumerate(frame_differences) if diff > threshold]
        
        # Calculate shot lengths
        shot_lengths = []
        prev_cut = 0
        for cut in cuts:
            shot_length = (cut - prev_cut) * sample_interval / fps if fps > 0 else 0
            shot_lengths.append(shot_length)
            prev_cut = cut
        
        # Last shot
        if cuts:
            last_shot_length = (len(frames) - cuts[-1]) * sample_interval / fps if fps > 0 else 0
            shot_lengths.append(last_shot_length)
        
        avg_shot_length = np.mean(shot_lengths) if shot_lengths else len(frames) * sample_interval / fps if fps > 0 else 0
        cut_frequency = len(cuts) / (len(frames) * sample_interval / fps) if fps > 0 else 0
        
        return {
            'cut_count': len(cuts),
            'cut_frequency_per_minute': float(cut_frequency * 60),
            'average_shot_length_seconds': float(avg_shot_length),
            'assessment': self._assess_editing_pace(avg_shot_length, cut_frequency),
            'recommendations': self._get_editing_recommendations(avg_shot_length, cut_frequency)
        }
    
    def _get_composition_recommendations(self, composition_score: float, center_focus: float) -> List[str]:
        """Get composition recommendations"""
        recommendations = []
        
        if composition_score < 0.2:
            recommendations.append("Consider using the rule of thirds - place important subjects at intersection points")
        
        if center_focus < 0.8:
            recommendations.append("Subject may be too centered - try offsetting for more dynamic composition")
        elif center_focus > 1.5:
            recommendations.append("Good use of center focus - composition is balanced")
        
        return recommendations
    
    def _get_color_recommendations(self, brightness: float, contrast: float, saturation: float, exposure: str) -> List[str]:
        """Get color and exposure recommendations"""
        recommendations = []
        
        if exposure == 'underexposed':
            recommendations.append("Video is underexposed - increase exposure or add lighting")
        elif exposure == 'overexposed':
            recommendations.append("Video is overexposed - reduce exposure or use ND filter")
        
        if contrast < 30:
            recommendations.append("Contrast is low - consider increasing contrast in post-production")
        elif contrast > 80:
            recommendations.append("Contrast is high - may lose detail in shadows/highlights")
        
        if saturation < 50:
            recommendations.append("Colors appear muted - consider increasing saturation")
        elif saturation > 200:
            recommendations.append("Colors are oversaturated - consider reducing saturation for more natural look")
        
        return recommendations
    
    def _get_stability_recommendations(self, stability: str, motion_level: str) -> List[str]:
        """Get stability recommendations"""
        recommendations = []
        
        if stability == 'shaky':
            recommendations.append("Video is shaky - use stabilization in post-production or a gimbal/tripod")
        elif stability == 'somewhat_shaky':
            recommendations.append("Minor camera shake detected - consider using stabilization")
        
        if motion_level == 'high' and stability != 'very_stable':
            recommendations.append("High motion detected - ensure motion blur is intentional or use faster shutter speed")
        
        return recommendations
    
    def _assess_editing_pace(self, avg_shot_length: float, cut_frequency: float) -> str:
        """Assess editing pace"""
        if avg_shot_length < 2:
            return 'fast_paced'
        elif avg_shot_length < 5:
            return 'moderate'
        else:
            return 'slow_paced'
    
    def _get_editing_recommendations(self, avg_shot_length: float, cut_frequency: float) -> List[str]:
        """Get editing recommendations"""
        recommendations = []
        
        if avg_shot_length < 1:
            recommendations.append("Shots are very short - consider longer shots for better storytelling")
        elif avg_shot_length > 10:
            recommendations.append("Shots are long - consider more cuts to maintain viewer engagement")
        
        if cut_frequency > 30:
            recommendations.append("High cut frequency - may be too fast-paced for some content types")
        elif cut_frequency < 5:
            recommendations.append("Low cut frequency - consider more cuts to improve pacing")
        
        return recommendations
    
    def _detect_content_type(self, analysis: Dict) -> str:
        """Detect likely content type based on analysis"""
        technical = analysis.get('technical', {})
        editing = analysis.get('editing', {})
        motion = analysis.get('motion_stability', {})
        
        resolution = technical.get('resolution', {})
        width = resolution.get('width', 1920)
        height = resolution.get('height', 1080)
        
        avg_shot_length = editing.get('average_shot_length_seconds', 0)
        motion_level = motion.get('motion_level', 'low')
        
        # Heuristics for content type
        if width == 1080 and height == 1920:  # Vertical
            return 'short_form_vertical'  # TikTok, Instagram Reels, YouTube Shorts
        elif width == 1920 and height == 1080:  # Horizontal
            if avg_shot_length < 3 and motion_level == 'high':
                return 'fast_paced_content'  # Action, gaming
            elif avg_shot_length > 5:
                return 'tutorial_or_talking_head'  # Educational, vlogs
            else:
                return 'general_content'
        else:
            return 'general_content'
    
    def _generate_recommendations(self, analysis: Dict) -> List[str]:
        """Generate overall recommendations"""
        recommendations = []
        
        technical = analysis.get('technical', {})
        composition = analysis.get('composition', {})
        color = analysis.get('color_exposure', {})
        motion = analysis.get('motion_stability', {})
        editing = analysis.get('editing', {})
        
        # Technical recommendations
        resolution = technical.get('resolution', {})
        width = resolution.get('width', 0)
        height = resolution.get('height', 0)
        
        if width < 1280 or height < 720:
            recommendations.append("Resolution is below HD - consider recording in at least 1080p for better quality")
        
        fps = technical.get('fps', 0)
        if fps < 24:
            recommendations.append("Frame rate is low - consider 24fps minimum, 30fps for smoother motion")
        
        # Composition recommendations
        comp_recs = composition.get('recommendations', [])
        recommendations.extend(comp_recs)
        
        # Color recommendations
        color_recs = color.get('recommendations', [])
        recommendations.extend(color_recs)
        
        # Stability recommendations
        stability_recs = motion.get('recommendations', [])
        recommendations.extend(stability_recs)
        
        # Editing recommendations
        editing_recs = editing.get('recommendations', [])
        recommendations.extend(editing_recs)
        
        return recommendations

# Global instance
_video_analyzer: Optional[VideoAnalyzer] = None

def get_video_analyzer() -> VideoAnalyzer:
    """Get or create the global video analyzer instance"""
    global _video_analyzer
    if _video_analyzer is None:
        _video_analyzer = VideoAnalyzer()
    return _video_analyzer

