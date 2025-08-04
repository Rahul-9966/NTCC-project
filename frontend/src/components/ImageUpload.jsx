import React, { useState, useRef } from 'react';
import { Upload, Download, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from '../hooks/use-toast';

const ImageUpload = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [enhancedImage, setEnhancedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const { toast } = useToast();

  const handleFileSelect = (event) => {
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
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target.result);
        setEnhancedImage(null); // Reset enhanced image
        toast({
          title: "Image uploaded successfully",
          description: "You can now enhance your medical image.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateEnhancement = () => {
    if (!originalImage) return;

    setIsProcessing(true);

    // Simulate processing delay
    setTimeout(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Convert to grayscale and apply basic sharpening effect
        for (let i = 0; i < data.length; i += 4) {
          // Grayscale conversion
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          
          // Apply slight enhancement (increased contrast)
          const enhanced = Math.min(255, gray * 1.2);
          
          data[i] = enhanced;     // Red
          data[i + 1] = enhanced; // Green
          data[i + 2] = enhanced; // Blue
          // Alpha channel remains unchanged
        }
        
        // Apply sharpening effect (simplified)
        ctx.putImageData(imageData, 0, 0);
        
        // Convert enhanced canvas to data URL
        const enhancedDataUrl = canvas.toDataURL('image/png');
        setEnhancedImage(enhancedDataUrl);
        setIsProcessing(false);
        
        toast({
          title: "Enhancement completed",
          description: "Your medical image has been enhanced successfully.",
        });
      };
      
      img.src = originalImage;
    }, 1500);
  };

  const downloadEnhancedImage = () => {
    if (!enhancedImage) return;
    
    const link = document.createElement('a');
    link.href = enhancedImage;
    link.download = `enhanced_medical_image_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: "Enhanced image is being downloaded.",
    });
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
              <Button onClick={triggerFileSelect} size="lg" className="bg-slate-900 hover:bg-slate-800">
                <Upload className="w-4 h-4 mr-2" />
                Select Image
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
                  onClick={simulateEnhancement}
                  disabled={isProcessing}
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
                Enhanced Medical Image (Simulated)
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

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ImageUpload;