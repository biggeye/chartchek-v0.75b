'use client';

import React, { useEffect, useState } from 'react';
import { useStreamStore } from '@/store/chat/streamStore';

interface PDFPreviewProps {
  className?: string;
}

export default function PDFPreview({ className = '' }: PDFPreviewProps) {
  const pdfPreviewUrl = useStreamStore(state => state.pdfPreviewUrl);
  const setPdfPreviewUrl = useStreamStore(state => state.setPdfPreviewUrl);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Clean up the object URL when component unmounts or URL changes
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        // Only revoke if it's an object URL (starts with blob:)
        if (pdfPreviewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(pdfPreviewUrl);
        }
      }
    };
  }, [pdfPreviewUrl]);

  if (!pdfPreviewUrl) return null;

  const handleDownload = () => {
    if (pdfPreviewUrl) {
      const link = document.createElement('a');
      link.href = pdfPreviewUrl;
      link.download = 'PatientEvaluation.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClose = () => {
    setPdfPreviewUrl(null);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const fullscreenClass = isFullscreen 
    ? 'fixed inset-0 z-50 bg-white p-4' 
    : '';

  return (
    <div className={`pdf-preview mt-4 border border-gray-200 rounded-lg overflow-hidden ${fullscreenClass} ${className}`}>
      <div className="bg-gray-100 p-2 flex justify-between items-center">
        <h3 className="text-sm font-medium">Patient Evaluation PDF</h3>
        <div className="flex space-x-2">
          <button 
            onClick={handleDownload}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Download
          </button>
          <button 
            onClick={toggleFullscreen}
            className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
          <button 
            onClick={handleClose}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
      
      <iframe
        src={pdfPreviewUrl}
        width="100%"
        height={isFullscreen ? "calc(100vh - 100px)" : "600px"}
        title="Patient Evaluation PDF Preview"
        className="border-0"
      />
    </div>
  );
}
