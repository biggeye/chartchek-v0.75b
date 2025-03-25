'use client';

import { useEffect, useState } from 'react';
import { usePatientStore } from '@/store/patientStore';
import { useFacilityStore } from '@/store/facilityStore';
import { PatientListItem } from '@/components/patient/PatientListItem';
import { PatientSearch } from '@/components/patient/PatientSearch';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { kipuGetPatients } from '@/lib/kipu/service/patient-service';
import { Calendar, Users, FileCheck, AlertCircle, UserPlus, Star, Activity } from 'lucide-react';

// Define a type that matches the PatientListItem component requirements
interface PatientListItemType {
  patientId: string;
  firstName: string;
  lastName: string;
  dob?: string;
  gender?: string;
  contact?: {
    email?: string;
    phone?: string;
  };
}

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { patients, isLoading, error } = usePatientStore();
  const { currentFacilityId } = useFacilityStore();

  return (
    <div className="container py-6">
      <ScrollArea className="h-full w-full overflow-y-auto mb-20">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Primary Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Census</p>
                <h3 className="text-2xl font-bold text-blue-700">5 / 6</h3>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">Next U.R.</p>
                <h3 className="text-2xl font-bold text-green-700">Mar 20</h3>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-900">Auth Pending</p>
                <h3 className="text-2xl font-bold text-amber-700">2</h3>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-900">Recent VOB</p>
                <div className="text-sm text-purple-700">
                  <p>J.G. – AETNA</p>
                  <p>H.W. – UHC</p>
                </div>
              </div>
              <FileCheck className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Middle Section - Treatment Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-xl font-bold">Treatment Stats</h2>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-100 rounded-md">
              <p className="text-muted-foreground">Treatment statistics visualization</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Side Metrics */}
        <div className="space-y-4">
          <Card className="bg-teal-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-teal-900">Client Satisfaction</p>
                  <h3 className="text-2xl font-bold text-teal-700">4.8/5</h3>
                </div>
                <Star className="h-8 w-8 text-teal-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-indigo-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-900">Review Average</p>
                  <h3 className="text-2xl font-bold text-indigo-700">4.6/5</h3>
                </div>
                <Star className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-rose-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-rose-900">Inspire Change</p>
                  <div className="text-sm text-rose-700">
                    <p>Internal: 92%</p>
                    <p>External: 87%</p>
                  </div>
                </div>
                <Activity className="h-8 w-8 text-rose-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Recent Admissions & Upcoming Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">Upcoming Items</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="font-medium">Upcoming Survey</p>
                <p className="text-sm text-muted-foreground">Patient satisfaction survey due Mar 25</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="font-medium">Special Days</p>
                <p className="text-sm text-muted-foreground">Staff appreciation day on Mar 30</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="font-medium">Aging Report</p>
                <p className="text-sm text-muted-foreground">Monthly review scheduled for Mar 31</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Community Events */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Community Events</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="font-medium">Recovery Support Group</p>
              <p className="text-sm text-muted-foreground">Every Tuesday at 7 PM</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="font-medium">Family Education Workshop</p>
              <p className="text-sm text-muted-foreground">March 25th at 6 PM</p>
            </div>
          </div>
        </CardContent>
      </Card>
      </ScrollArea>
      {/* Patient Search & List - Preserved from original but hidden by default */}
      <div className="hidden">
        {/* Fix: Check PatientSearch component props and adjust accordingly */}
        <PatientSearch 
    searchQuery={searchQuery} 
    setSearchQuery={setSearchQuery} 
  />
        
        <div className="mt-6">
        
        </div>
      </div>
    </div>
  );
}