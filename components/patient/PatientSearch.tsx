'use client';

import { Input } from '@/components/ui/input';
import { Search, Calendar, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PatientSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateRange?: { 
    start: string | null; 
    end: string | null 
  };
  setDateRange?: (range: { 
    start: string | null; 
    end: string | null 
  }) => void;
}

export function PatientSearch({ 
  searchQuery, 
  setSearchQuery,
  dateRange = { start: null, end: null },
  setDateRange = () => {}
}: PatientSearchProps) {
  const [showDateFilters, setShowDateFilters] = useState(false);
  const [localStartDate, setLocalStartDate] = useState(dateRange.start || '');
  const [localEndDate, setLocalEndDate] = useState(dateRange.end || '');

  // Sync local state with props when they change
  useEffect(() => {
    setLocalStartDate(dateRange.start || '');
    setLocalEndDate(dateRange.end || '');
  }, [dateRange.start, dateRange.end]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setLocalStartDate(newDate);
    setDateRange({ 
      ...dateRange, 
      start: newDate || null 
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setLocalEndDate(newDate);
    setDateRange({ 
      ...dateRange, 
      end: newDate || null 
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setLocalStartDate('');
    setLocalEndDate('');
    setDateRange({ start: null, end: null });
  };

  return (
    <div className="w-full">
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search patients..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="flex items-center mb-3">
        <button 
          type="button"
          onClick={() => setShowDateFilters(!showDateFilters)}
          className="flex items-center px-3 py-1.5 text-sm bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          <Calendar className="h-4 w-4 mr-1.5" />
          {showDateFilters ? 'Hide' : 'Show'} Date Filters
        </button>
        
        {(searchQuery || localStartDate || localEndDate) && (
          <button 
            type="button"
            onClick={handleClearFilters}
            className="ml-3 flex items-center px-3 py-1.5 text-sm bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <X className="h-4 w-4 mr-1.5" />
            Clear Filters
          </button>
        )}
      </div>
      
      {showDateFilters && (
        <div className="flex flex-col sm:flex-row gap-4 p-4 mb-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Admission From</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={localStartDate}
              onChange={handleStartDateChange}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={localEndDate}
              onChange={handleEndDateChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}