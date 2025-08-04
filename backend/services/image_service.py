import os
import cv2
import numpy as np
import aiofiles
from PIL import Image
from datetime import datetime
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class ImageEnhancementService:
    def __init__(self):
        self.upload_dir = Path("/app/backend/uploads")
        self.original_dir = self.upload_dir / "original"
        self.enhanced_dir = self.upload_dir / "enhanced"
        
        # Ensure directories exist
        self.original_dir.mkdir(parents=True, exist_ok=True)
        self.enhanced_dir.mkdir(parents=True, exist_ok=True)
    
    async def save_uploaded_image(self, file_content: bytes, image_id: str, filename: str) -> str:
        """Save uploaded image to original directory"""
        try:
            file_extension = Path(filename).suffix.lower()
            original_path = self.original_dir / f"{image_id}{file_extension}"
            
            async with aiofiles.open(original_path, 'wb') as f:
                await f.write(file_content)
            
            return str(original_path)
        except Exception as e:
            logger.error(f"Error saving uploaded image: {e}")
            raise
    
    async def enhance_image(self, image_id: str, original_path: str) -> tuple[str, float]:
        """Enhance image using OpenCV (grayscale + sharpening simulation)"""
        start_time = datetime.now()
        
        try:
            # Read the image
            image = cv2.imread(original_path)
            if image is None:
                raise ValueError("Could not read image file")
            
            # Convert to grayscale
            gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply sharpening filter (simulation)
            kernel = np.array([[-1,-1,-1],
                             [-1, 9,-1],
                             [-1,-1,-1]])
            sharpened = cv2.filter2D(gray_image, -1, kernel)
            
            # Enhance contrast slightly
            enhanced = cv2.convertScaleAbs(sharpened, alpha=1.2, beta=10)
            
            # Save enhanced image as PNG
            enhanced_path = self.enhanced_dir / f"{image_id}.png"
            cv2.imwrite(str(enhanced_path), enhanced)
            
            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return str(enhanced_path), processing_time
            
        except Exception as e:
            logger.error(f"Error enhancing image: {e}")
            raise
    
    def validate_image_file(self, filename: str, file_size: int) -> tuple[bool, str]:
        """Validate uploaded image file"""
        # Check file size (10MB limit)
        if file_size > 10 * 1024 * 1024:
            return False, "File size exceeds 10MB limit"
        
        # Check file extension
        allowed_extensions = {'.jpg', '.jpeg', '.png'}
        file_extension = Path(filename).suffix.lower()
        
        if file_extension not in allowed_extensions:
            return False, "Only JPG, JPEG, and PNG files are allowed"
        
        return True, "Valid file"
    
    def get_image_mime_type(self, filename: str) -> str:
        """Get MIME type based on file extension"""
        extension = Path(filename).suffix.lower()
        mime_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png'
        }
        return mime_types.get(extension, 'application/octet-stream')
    
    async def cleanup_failed_upload(self, image_id: str):
        """Clean up files if upload/processing fails"""
        try:
            # Remove original file if exists
            original_files = list(self.original_dir.glob(f"{image_id}.*"))
            for file_path in original_files:
                file_path.unlink(missing_ok=True)
            
            # Remove enhanced file if exists
            enhanced_path = self.enhanced_dir / f"{image_id}.png"
            enhanced_path.unlink(missing_ok=True)
            
        except Exception as e:
            logger.error(f"Error cleaning up failed upload: {e}")

# Global instance
image_service = ImageEnhancementService()