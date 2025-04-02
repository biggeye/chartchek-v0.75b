'use client';

import React from 'react';
import { useStreamStore } from '@/store/chat/streamStore';
import { Loader2 } from 'lucide-react';

export const PDFGenerationIndicator = () => {
  const { isFormProcessing } = useStreamStore();

  if (!isFormProcessing) return null;

  return (
    <div className="fixed bottom-20 right-5 bg-white dark:bg-gray-800 rounded-md shadow-lg p-4 z-50 flex items-center gap-3 border border-gray-200 dark:border-gray-700">
      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      <span className="text-sm font-medium">Generating PDF...</span>
    </div>
  );
};

export default PDFGenerationIndicator;
