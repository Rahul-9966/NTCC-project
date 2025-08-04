# Medical Image Enhancement System - API Contracts

## 🎯 Overview
This document defines the API contracts and integration plan for the Medical Image Enhancement System.

## 📊 Mock Data to Replace

### Current Mock Data (in `/frontend/src/mock/mockData.js`):
- `mockEnhancementHistory[]` - Enhancement records with metadata
- `mockImageProcessingStats` - System statistics
- `mockAPI.uploadImage()` - Image upload simulation
- `mockAPI.enhanceImage()` - Enhancement processing simulation
- `mockAPI.getEnhancementHistory()` - History retrieval

## 🚀 API Endpoints to Implement

### 1. Image Upload
**POST** `/api/images/upload`
- **Purpose**: Upload medical image for enhancement
- **Request**: `multipart/form-data` with image file
- **Validation**: JPG/JPEG/PNG, max 10MB
- **Response**:
```json
{
  "success": true,
  "imageId": "uuid",
  "originalImageUrl": "/api/images/original/{imageId}",
  "message": "Image uploaded successfully"
}
```

### 2. Image Enhancement
**POST** `/api/images/{imageId}/enhance`
- **Purpose**: Process uploaded image (grayscale + sharpening)
- **Response**:
```json
{
  "success": true,
  "enhancedImageUrl": "/api/images/enhanced/{imageId}",
  "processingTime": 1.5,
  "enhancementType": "Grayscale + Sharpening",
  "message": "Image enhanced successfully"
}
```

### 3. Enhancement History
**GET** `/api/images/history`
- **Purpose**: Get user's enhancement history
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "originalImageName": "brain_scan_001.png",
      "enhancedImageName": "enhanced_brain_scan_001.png",
      "uploadDate": "2025-01-15T10:30:00Z",
      "enhancementType": "Grayscale + Sharpening",
      "status": "Completed",
      "processingTime": 1.5
    }
  ]
}
```

### 4. Image Retrieval
**GET** `/api/images/original/{imageId}`
- **Purpose**: Serve original uploaded image
- **Response**: Image file with proper headers

**GET** `/api/images/enhanced/{imageId}`
- **Purpose**: Serve enhanced image
- **Response**: PNG image file

### 5. Download Enhanced Image
**GET** `/api/images/{imageId}/download`
- **Purpose**: Download enhanced image with proper filename
- **Response**: PNG file with `Content-Disposition: attachment`

## 🗄️ MongoDB Models

### ImageRecord Model
```python
{
  "_id": ObjectId,
  "id": str,  # UUID
  "originalImageName": str,
  "originalImagePath": str,
  "enhancedImagePath": str,
  "uploadDate": datetime,
  "enhancementDate": datetime,
  "enhancementType": str,
  "status": str,  # "Processing", "Completed", "Failed"
  "processingTime": float,
  "fileSize": int,
  "mimeType": str
}
```

## 📁 File Storage Structure
```
/app/backend/uploads/
├── original/
│   └── {imageId}.{ext}
└── enhanced/
    └── {imageId}.png
```

## 🔧 Backend Implementation Plan

### 1. Dependencies to Add
- `opencv-python` - Image processing
- `pillow` - Image handling
- `python-multipart` - File uploads
- `aiofiles` - Async file operations

### 2. Core Components
- **Image Upload Handler**: File validation, storage, MongoDB record
- **Image Enhancement Processor**: OpenCV grayscale + sharpening simulation
- **File Server**: Serve original/enhanced images
- **CRUD Operations**: Database operations for image records

### 3. Error Handling
- File validation errors
- Storage failures
- Processing errors
- Database connection issues

## 🔗 Frontend Integration Plan

### Replace Mock Functions:
1. **Upload Component** (`ImageUpload.jsx`):
   - Replace mock file handling with actual API calls
   - Update progress indicators during real processing
   - Handle real error responses

2. **Enhancement History** (`EnhancementHistory.jsx`):
   - Replace `mockAPI.getEnhancementHistory()` with real API call
   - Update download functionality to use real endpoints

3. **API Integration**:
   - Remove `mock/mockData.js` imports
   - Add real axios calls to backend endpoints
   - Update error handling for real API responses

### Environment Variables:
- Use existing `REACT_APP_BACKEND_URL` from frontend `.env`
- Backend will use existing `MONGO_URL` from backend `.env`

## ✅ Success Criteria
- [ ] Images upload and store properly
- [ ] Enhancement processing works (grayscale + sharpening)
- [ ] History displays real data from MongoDB
- [ ] Download functionality works with real files
- [ ] Error handling for all edge cases
- [ ] File cleanup and proper storage management