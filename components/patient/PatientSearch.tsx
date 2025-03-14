'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface PatientSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function PatientSearch({ searchQuery, setSearchQuery }: PatientSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search patients..."
        className="pl-8"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
}
