"""
CAD/3D Printing Tools
Handles photo-to-STL conversion (photogrammetry) and photo-to-SVG conversion (vectorization)
"""

import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import logging
import json
from PIL import Image, ImageDraw, ImageFont
import subprocess
import tempfile
import os

logger = logging.getLogger(__name__)

class CAD3DTools:
    """CAD and 3D printing tools for converting photos to STL and SVG"""
    
    def __init__(self):
        self.supported_image_formats = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']
    
    def photos_to_stl(
        self,
        photo_paths: List[Path],
        output_path: Path,
        quality: str = 'medium'
    ) -> Path:
        """
        Convert multiple photos to STL using photogrammetry
        
        Args:
            photo_paths: List of photo file paths (multiple angles)
            output_path: Path to save STL file
            quality: 'low', 'medium', 'high'
        
        Returns:
            Path to generated STL file
        """
        try:
            logger.info(f"Converting {len(photo_paths)} photos to STL")
            
            # For now, we'll use a depth estimation approach
            # In production, you'd use proper photogrammetry software like COLMAP, Meshroom, etc.
            
            # Step 1: Load and preprocess images
            images = []
            for photo_path in photo_paths:
                img = cv2.imread(str(photo_path))
                if img is None:
                    raise ValueError(f"Could not load image: {photo_path}")
                images.append(img)
            
            # Step 2: Create depth map from first image (simplified approach)
            # In production, use multi-view stereo reconstruction
            primary_image = images[0]
            gray = cv2.cvtColor(primary_image, cv2.COLOR_BGR2GRAY)
            
            # Create depth map using edge detection and distance transform
            edges = cv2.Canny(gray, 50, 150)
            depth_map = cv2.distanceTransform(255 - edges, cv2.DIST_L2, 5)
            depth_map = cv2.normalize(depth_map, None, 0, 255, cv2.NORM_MINMAX)
            
            # Step 3: Generate point cloud from depth map
            height, width = depth_map.shape
            points = []
            faces = []
            
            # Create vertices from depth map
            for y in range(0, height, max(1, height // 200)):  # Sample points
                for x in range(0, width, max(1, width // 200)):
                    z = float(depth_map[y, x]) / 255.0 * 10.0  # Scale depth
                    # Normalize coordinates to -1 to 1
                    x_norm = (x / width) * 2 - 1
                    y_norm = (y / height) * 2 - 1
                    z_norm = z / 10.0 - 0.5
                    points.append((x_norm, y_norm, z_norm))
            
            # Step 4: Generate mesh faces (triangles)
            rows = height // max(1, height // 200)
            cols = width // max(1, width // 200)
            
            for i in range(rows - 1):
                for j in range(cols - 1):
                    idx = i * cols + j
                    # Create two triangles per quad
                    faces.append((idx, idx + 1, idx + cols))
                    faces.append((idx + 1, idx + cols + 1, idx + cols))
            
            # Step 5: Write STL file
            self._write_stl(output_path, points, faces)
            
            logger.info(f"STL file generated: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Error converting photos to STL: {e}", exc_info=True)
            raise
    
    def _write_stl(self, output_path: Path, points: List[Tuple[float, float, float]], faces: List[Tuple[int, int, int]]):
        """Write STL file in ASCII format"""
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            f.write("solid generated_model\n")
            
            for face in faces:
                # Get vertices for this face
                v1 = points[face[0]]
                v2 = points[face[1]]
                v3 = points[face[2]]
                
                # Calculate normal (simplified)
                edge1 = (v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2])
                edge2 = (v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2])
                normal = self._cross_product(edge1, edge2)
                normal = self._normalize(normal)
                
                f.write(f"  facet normal {normal[0]:.6f} {normal[1]:.6f} {normal[2]:.6f}\n")
                f.write("    outer loop\n")
                f.write(f"      vertex {v1[0]:.6f} {v1[1]:.6f} {v1[2]:.6f}\n")
                f.write(f"      vertex {v2[0]:.6f} {v2[1]:.6f} {v2[2]:.6f}\n")
                f.write(f"      vertex {v3[0]:.6f} {v3[1]:.6f} {v3[2]:.6f}\n")
                f.write("    endloop\n")
                f.write("  endfacet\n")
            
            f.write("endsolid generated_model\n")
    
    def _cross_product(self, a: Tuple[float, float, float], b: Tuple[float, float, float]) -> Tuple[float, float, float]:
        """Calculate cross product of two 3D vectors"""
        return (
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        )
    
    def _normalize(self, v: Tuple[float, float, float]) -> Tuple[float, float, float]:
        """Normalize a 3D vector"""
        length = np.sqrt(v[0]**2 + v[1]**2 + v[2]**2)
        if length == 0:
            return (0, 0, 1)
        return (v[0] / length, v[1] / length, v[2] / length)
    
    def photo_to_svg(
        self,
        photo_path: Path,
        output_path: Path,
        simplify: bool = True,
        threshold: int = 128
    ) -> Path:
        """
        Convert photo to SVG using vectorization
        
        Args:
            photo_path: Path to input photo
            output_path: Path to save SVG file
            simplify: Whether to simplify paths
            threshold: Threshold for edge detection (0-255)
        
        Returns:
            Path to generated SVG file
        """
        try:
            logger.info(f"Converting photo to SVG: {photo_path}")
            
            # Load image
            img = cv2.imread(str(photo_path))
            if img is None:
                raise ValueError(f"Could not load image: {photo_path}")
            
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Apply threshold
            _, binary = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)
            
            # Find contours
            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Get image dimensions
            height, width = img.shape[:2]
            
            # Write SVG
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w') as f:
                f.write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">\n')
                f.write(f'  <rect width="{width}" height="{height}" fill="white"/>\n')
                
                for contour in contours:
                    if len(contour) < 3:
                        continue
                    
                    # Simplify contour if requested
                    if simplify:
                        epsilon = 0.02 * cv2.arcLength(contour, True)
                        contour = cv2.approxPolyDP(contour, epsilon, True)
                    
                    # Convert to path string
                    path_str = "M "
                    for i, point in enumerate(contour):
                        x, y = point[0]
                        if i == 0:
                            path_str += f"{x},{y} "
                        else:
                            path_str += f"L {x},{y} "
                    path_str += "Z"
                    
                    f.write(f'  <path d="{path_str}" fill="black" stroke="none"/>\n')
                
                f.write('</svg>\n')
            
            logger.info(f"SVG file generated: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Error converting photo to SVG: {e}", exc_info=True)
            raise
    
    def analyze_photo_for_3d(
        self,
        photo_path: Path
    ) -> Dict:
        """
        Analyze photo to determine if it's suitable for 3D reconstruction
        
        Returns:
            Dictionary with analysis results
        """
        try:
            img = cv2.imread(str(photo_path))
            if img is None:
                raise ValueError(f"Could not load image: {photo_path}")
            
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Analyze image quality
            # Check for blur
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            is_blurry = laplacian_var < 100
            
            # Check for contrast
            contrast = gray.std()
            
            # Check for edges (important for depth estimation)
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.sum(edges > 0) / (gray.shape[0] * gray.shape[1])
            
            # Estimate if multiple angles would help
            needs_multiple_angles = edge_density < 0.1 or is_blurry
            
            return {
                "suitable_for_3d": not is_blurry and edge_density > 0.05,
                "is_blurry": is_blurry,
                "contrast": float(contrast),
                "edge_density": float(edge_density),
                "needs_multiple_angles": needs_multiple_angles,
                "recommendations": self._get_recommendations(is_blurry, edge_density, contrast)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing photo: {e}", exc_info=True)
            raise
    
    def _get_recommendations(
        self,
        is_blurry: bool,
        edge_density: float,
        contrast: float
    ) -> List[str]:
        """Get recommendations for better 3D reconstruction"""
        recommendations = []
        
        if is_blurry:
            recommendations.append("Image is blurry. Use a sharper photo for better results.")
        
        if edge_density < 0.05:
            recommendations.append("Low edge density. Photos with more detail/texture work better.")
        
        if contrast < 30:
            recommendations.append("Low contrast. Better lighting would improve results.")
        
        if not recommendations:
            recommendations.append("Photo looks good for 3D reconstruction!")
        
        return recommendations

# Global instance
_cad_tools: Optional[CAD3DTools] = None

def get_cad_tools() -> CAD3DTools:
    """Get or create the global CAD tools instance"""
    global _cad_tools
    if _cad_tools is None:
        _cad_tools = CAD3DTools()
    return _cad_tools

