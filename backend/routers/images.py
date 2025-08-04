import os
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from pathlib import Path
import logging

from models.image_models import (
    ImageUploadResponse, 
    ImageEnhanceResponse, 
    ImageRecord, 
    ImageHistoryResponse,
    ErrorResponse
)
from services.image_service import image_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/images", tags=["images"])

# Database will be injected from main app
images_collection = None

def set_database(db):
    """Set database connection from main app"""
    global images_collection
    images_collection = db.medical_images

@router.post("/upload", response_model=ImageUploadResponse)
async def upload_image(file: UploadFile = File(...)):
    """Upload a medical image for enhancement"""
    try:
        # Validate file
        file_content = await file.read()
        is_valid, validation_message = image_service.validate_image_file(file.filename, len(file_content))
        
        if not is_valid:
            raise HTTPException(status_code=400, detail=validation_message)
        
        # Create image record
        image_record = ImageRecord(
            originalImageName=file.filename,
            originalImagePath="",  # Will be updated after saving
            fileSize=len(file_content),
            mimeType=image_service.get_image_mime_type(file.filename)
        )
        
        try:
            # Save uploaded file
            original_path = await image_service.save_uploaded_image(
                file_content, image_record.id, file.filename
            )
            image_record.originalImagePath = original_path
            
            # Save to MongoDB
            await images_collection.insert_one(image_record.dict())
            
            return ImageUploadResponse(
                success=True,
                imageId=image_record.id,
                originalImageUrl=f"/api/images/original/{image_record.id}",
                message="Image uploaded successfully"
            )
            
        except Exception as e:
            # Cleanup on failure
            await image_service.cleanup_failed_upload(image_record.id)
            logger.error(f"Upload failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to upload image")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in upload: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/{image_id}/enhance", response_model=ImageEnhanceResponse)
async def enhance_image(image_id: str, background_tasks: BackgroundTasks):
    """Enhance uploaded medical image"""
    try:
        # Find image record
        image_record = await images_collection.find_one({"id": image_id})
        if not image_record:
            raise HTTPException(status_code=404, detail="Image not found")
        
        if image_record.get("status") == "Processing":
            raise HTTPException(status_code=409, detail="Image is already being processed")
        
        # Update status to processing
        await images_collection.update_one(
            {"id": image_id},
            {"$set": {"status": "Processing"}}
        )
        
        try:
            # Enhance the image
            enhanced_path, processing_time = await image_service.enhance_image(
                image_id, image_record["originalImagePath"]
            )
            
            # Update record with enhancement details
            await images_collection.update_one(
                {"id": image_id},
                {"$set": {
                    "enhancedImagePath": enhanced_path,
                    "enhancementDate": datetime.utcnow(),
                    "enhancementType": "Grayscale + Sharpening",
                    "status": "Completed",
                    "processingTime": processing_time
                }}
            )
            
            return ImageEnhanceResponse(
                success=True,
                enhancedImageUrl=f"/api/images/enhanced/{image_id}",
                processingTime=processing_time,
                enhancementType="Grayscale + Sharpening",
                message="Image enhanced successfully"
            )
            
        except Exception as e:
            # Update status to failed
            await images_collection.update_one(
                {"id": image_id},
                {"$set": {"status": "Failed"}}
            )
            logger.error(f"Enhancement failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to enhance image")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in enhance: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/history", response_model=ImageHistoryResponse)
async def get_enhancement_history():
    """Get enhancement history for all processed images"""
    try:
        # Get all completed image records, sorted by upload date (newest first)
        cursor = images_collection.find(
            {"status": {"$in": ["Completed", "Processing", "Failed"]}},
            sort=[("uploadDate", -1)],
            limit=50
        )
        
        history_records = []
        async for record in cursor:
            # Format record for frontend
            formatted_record = {
                "id": record["id"],
                "originalImageName": record["originalImageName"],
                "enhancedImageName": f"enhanced_{record['originalImageName']}.png" if record.get("enhancedImagePath") else None,
                "uploadDate": record["uploadDate"].isoformat(),
                "enhancementType": record.get("enhancementType", "Grayscale + Sharpening"),
                "status": record["status"],
                "processingTime": record.get("processingTime", 0)
            }
            history_records.append(formatted_record)
        
        return ImageHistoryResponse(
            success=True,
            data=history_records
        )
    
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch enhancement history")

@router.get("/original/{image_id}")
async def get_original_image(image_id: str):
    """Serve original uploaded image"""
    try:
        image_record = await images_collection.find_one({"id": image_id})
        if not image_record:
            raise HTTPException(status_code=404, detail="Image not found")
        
        original_path = Path(image_record["originalImagePath"])
        if not original_path.exists():
            raise HTTPException(status_code=404, detail="Image file not found")
        
        return FileResponse(
            path=str(original_path),
            media_type=image_record["mimeType"],
            filename=image_record["originalImageName"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving original image: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve image")

@router.get("/enhanced/{image_id}")
async def get_enhanced_image(image_id: str):
    """Serve enhanced image"""
    try:
        image_record = await images_collection.find_one({"id": image_id})
        if not image_record:
            raise HTTPException(status_code=404, detail="Image not found")
        
        if not image_record.get("enhancedImagePath"):
            raise HTTPException(status_code=404, detail="Enhanced image not available")
        
        enhanced_path = Path(image_record["enhancedImagePath"])
        if not enhanced_path.exists():
            raise HTTPException(status_code=404, detail="Enhanced image file not found")
        
        return FileResponse(
            path=str(enhanced_path),
            media_type="image/png",
            filename=f"enhanced_{image_record['originalImageName']}.png"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving enhanced image: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve enhanced image")

@router.get("/{image_id}/download")
async def download_enhanced_image(image_id: str):
    """Download enhanced image with proper filename"""
    try:
        image_record = await images_collection.find_one({"id": image_id})
        if not image_record:
            raise HTTPException(status_code=404, detail="Image not found")
        
        if not image_record.get("enhancedImagePath"):
            raise HTTPException(status_code=404, detail="Enhanced image not available")
        
        enhanced_path = Path(image_record["enhancedImagePath"])
        if not enhanced_path.exists():
            raise HTTPException(status_code=404, detail="Enhanced image file not found")
        
        # Create download filename
        original_name = Path(image_record["originalImageName"]).stem
        download_filename = f"enhanced_{original_name}_{image_id[:8]}.png"
        
        return FileResponse(
            path=str(enhanced_path),
            media_type="image/png",
            filename=download_filename,
            headers={"Content-Disposition": f"attachment; filename={download_filename}"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading enhanced image: {e}")
        raise HTTPException(status_code=500, detail="Failed to download enhanced image")