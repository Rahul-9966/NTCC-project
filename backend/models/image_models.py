from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class ImageUploadResponse(BaseModel):
    success: bool
    imageId: str
    originalImageUrl: str
    message: str

class ImageEnhanceResponse(BaseModel):
    success: bool
    enhancedImageUrl: str
    processingTime: float
    enhancementType: str
    message: str

class ImageRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    originalImageName: str
    originalImagePath: str
    enhancedImagePath: Optional[str] = None
    uploadDate: datetime = Field(default_factory=datetime.utcnow)
    enhancementDate: Optional[datetime] = None
    enhancementType: Optional[str] = None
    status: str = "Uploaded"  # "Uploaded", "Processing", "Completed", "Failed"
    processingTime: Optional[float] = None
    fileSize: int
    mimeType: str

class ImageHistoryResponse(BaseModel):
    success: bool
    data: list[dict]

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    message: str