import React, { useState, useEffect } from 'react';
import { History, Download, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EnhancementHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
    
    // Refresh history every 30 seconds to get latest data
    const interval = setInterval(loadHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/images/history`);
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      toast({
        title: "Failed to load history",
        description: "Could not fetch enhancement history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = async (item) => {
    if (item.status !== 'Completed') {
      toast({
        title: "Download not available",
        description: "Enhancement not completed yet",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await axios.get(`${API}/images/${item.id}/download`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = item.enhancedImageName || `enhanced_${item.originalImageName}.png`;
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
        description: `Downloading ${filename}`,
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download failed",
        description: "Could not download the enhanced image",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-3 h-3 mr-1 text-green-600" />;
      case 'Processing':
        return <Loader2 className="w-3 h-3 mr-1 animate-spin text-blue-600" />;
      case 'Failed':
        return <AlertCircle className="w-3 h-3 mr-1 text-red-600" />;
      default:
        return <Clock className="w-3 h-3 mr-1 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'text-green-600 border-green-200 bg-green-50';
      case 'Processing':
        return 'text-blue-600 border-blue-200 bg-blue-50';
      case 'Failed':
        return 'text-red-600 border-red-200 bg-red-50';
      default:
        return 'text-gray-600 border-gray-200 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Enhancement History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
              <span className="text-gray-600">Loading history...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Enhancement History
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={loadHistory}
          className="text-sm"
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No enhancement history available</p>
            <p className="text-sm mt-2">Upload and enhance images to see them here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900 truncate max-w-xs">
                      {item.originalImageName}
                    </h4>
                    <Badge variant="outline" className={getStatusColor(item.status)}>
                      {getStatusIcon(item.status)}
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.uploadDate)}
                    </span>
                    {item.processingTime && (
                      <span>Processing: {item.processingTime.toFixed(1)}s</span>
                    )}
                    {item.enhancementType && (
                      <span>Type: {item.enhancementType}</span>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => handleDownload(item)}
                  variant="outline"
                  size="sm"
                  className="ml-4"
                  disabled={item.status !== 'Completed'}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancementHistory;