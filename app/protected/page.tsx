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
  const { currentFacilityId, fetchFacilities } = useFacilityStore();

  useEffect(() => {
    // Fetch facilities only once on mount
    fetchFacilities();
  }, []); // Empty dependency array

  const patientsByFacility = patients.filter(patient => 
    String(patient.facilityId) === String(currentFacilityId)
  );

  // Filter patients based on search query
  const filteredPatients = patientsByFacility.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    // Enhanced search to include more fields
    return fullName.includes(query) || 
           (patient.patientId && patient.patientId.toString().toLowerCase().includes(query)) ||
           (patient.mrn && patient.mrn.toString().toLowerCase().includes(query)) ||
           (patient.gender && patient.gender.toLowerCase().includes(query));
  });

  // Get recent admissions (last 5 patients sorted by admission date)
  const recentAdmissions = [...patientsByFacility]
    .filter(patient => patient.admissionDate)
    .sort((a, b) => {
      // Fix: Add null checks before creating Date objects
      const dateA = a.admissionDate ? new Date(a.admissionDate).getTime() : 0;
      const dateB = b.admissionDate ? new Date(b.admissionDate).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

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
            <h2 className="text-xl font-bold">Recent Admissions</h2>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentAdmissions.length > 0 ? (
              <div className="divide-y">
                {recentAdmissions.map((patient) => (
                  <div key={patient.patientId} className="py-2 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{`${patient.firstName.charAt(0)}. ${patient.lastName}`}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {/* Fix: Add null check before creating Date object */}
                      {patient.admissionDate 
                        ? new Date(patient.admissionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'No date'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent admissions</p>
            )}
          </CardContent>
        </Card>
        
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
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Patients</h2>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="divide-y">
                  {patientsByFacility.map((patient) => {
                    const patientForList: PatientListItemType = {
                      patientId: patient.patientId || patient.mrn || '',
                      firstName: patient.firstName,
                      lastName: patient.lastName,
                      dob: patient.dateOfBirth,
                      gender: patient.gender,
                    };
                    
                    return (
                      <div key={patient.patientId || patient.mrn || `patient-${patient.mrn}`}>
                        <PatientListItem 
                          patient={patientForList} 
                          facilityId={currentFacilityId || ''}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}