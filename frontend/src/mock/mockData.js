// Mock data for Medical Image Enhancement System
export const mockEnhancementHistory = [
  {
    id: '1',
    originalImageName: 'brain_scan_001.png',
    enhancedImageName: 'enhanced_brain_scan_001.png',
    uploadDate: '2025-01-15T10:30:00Z',
    enhancementType: 'Grayscale + Sharpening',
    status: 'Completed',
    processingTime: 1.5 // seconds
  },
  {
    id: '2',
    originalImageName: 'chest_xray_002.jpg',
    enhancedImageName: 'enhanced_chest_xray_002.png',
    uploadDate: '2025-01-14T15:45:00Z',
    enhancementType: 'Grayscale + Sharpening',
    status: 'Completed',
    processingTime: 2.1
  },
  {
    id: '3',
    originalImageName: 'mri_scan_003.png',
    enhancedImageName: 'enhanced_mri_scan_003.png',
    uploadDate: '2025-01-13T09:15:00Z',
    enhancementType: 'Grayscale + Sharpening',
    status: 'Completed',
    processingTime: 1.8
  }
];

export const mockImageProcessingStats = {
  totalImagesProcessed: 127,
  averageProcessingTime: 1.7,
  successRate: 98.4,
  supportedFormats: ['JPG', 'JPEG', 'PNG'],
  maxFileSize: '10MB'
};

// Simulate API endpoints
export const mockAPI = {
  uploadImage: async (formData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          imageId: Math.random().toString(36).substr(2, 9),
          message: 'Image uploaded successfully',
          originalImageUrl: '/mock-image-url'
        });
      }, 1000);
    });
  },

  enhanceImage: async (imageId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          enhancedImageUrl: '/mock-enhanced-url',
          processingTime: Math.random() * 2 + 1,
          message: 'Image enhanced successfully'
        });
      }, 2000);
    });
  },

  getEnhancementHistory: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: mockEnhancementHistory
        });
      }, 500);
    });
  }
};