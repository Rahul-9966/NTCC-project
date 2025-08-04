import React, { useState, useRef } from 'react';
import { Upload, Download, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ImageUpload = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [enhancedImage, setEnhancedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [currentImageId, setCurrentImageId] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPG, JPEG, or PNG image.",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }

      setUploadedFile(file);
      setIsUploading(true);
      setEnhancedImage(null); // Reset enhanced image
      setCurrentImageId(null);

      // Display preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target.result);
      };
      reader.readAsDataURL(file);

      try {
        // Upload to backend
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API}/images/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          setCurrentImageId(response.data.imageId);
          toast({
            title: "Upload successful",
            description: response.data.message,
          });
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: error.response?.data?.detail || "Failed to upload image",
          variant: "destructive"
        });
        // Reset state on failure
        setOriginalImage(null);
        setUploadedFile(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const enhanceImage = async () => {
    if (!currentImageId) {
      toast({
        title: "No image to enhance",
        description: "Please upload an image first.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await axios.post(`${API}/images/${currentImageId}/enhance`);
      
      if (response.data.success) {
        // Set the enhanced image URL
        setEnhancedImage(`${API}/images/enhanced/${currentImageId}`);
        
        toast({
          title: "Enhancement completed",
          description: `Image enhanced in ${response.data.processingTime.toFixed(1)}s using ${response.data.enhancementType}`,
        });
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      toast({
        title: "Enhancement failed",
        description: error.response?.data?.detail || "Failed to enhance image",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadEnhancedImage = async () => {
    if (!currentImageId) return;
    
    try {
      const response = await axios.get(`${API}/images/${currentImageId}/download`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `enhanced_medical_image_${Date.now()}.png`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/"/g, '');
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: "Enhanced image is being downloaded.",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Failed to download enhanced image",
        variant: "destructive"
      });
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          🧠 AI-Based Medical Image Enhancement System
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload your medical images and enhance them using advanced AI algorithms for better visualization and analysis.
        </p>
      </div>

      {/* Upload Section */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Upload Medical Image</h3>
              <p className="text-gray-600 mb-4">
                Supported formats: JPG, JPEG, PNG (Max 10MB)
              </p>
              <Button 
                onClick={triggerFileSelect} 
                size="lg" 
                className="bg-slate-900 hover:bg-slate-800"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Select Image
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images Display */}
      {originalImage && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Original Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Uploaded Medical Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <img
                  src={originalImage}
                  alt="Original medical image"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-sm text-gray-600">
                  Original
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                <Button 
                  onClick={enhanceImage}
                  disabled={isProcessing || isUploading || !currentImageId}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Enhance Image
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Enhanced Medical Image (AI Processed)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {enhancedImage ? (
                  <>
                    <img
                      src={enhancedImage}
                      alt="Enhanced medical image"
                      className="w-full h-auto rounded-lg shadow-lg"
                      onLoad={() => {
                        toast({
                          title: "Enhancement ready",
                          description: "Enhanced image loaded successfully",
                        });
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-green-500/90 backdrop-blur-sm px-2 py-1 rounded-md text-sm text-white">
                      Enhanced
                    </div>
                  </>
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Enhanced image will appear here</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-center">
                <Button 
                  onClick={downloadEnhancedImage}
                  disabled={!enhancedImage}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Enhanced
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;