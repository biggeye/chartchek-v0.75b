'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, UserCircle2, FileText, Calendar } from 'lucide-react';
import { getFacilityData } from '@/lib/kipu';
import Link from 'next/link';

// Custom card components to replace missing exports
const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className || ''}`} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-muted-foreground ${className || ''}`} {...props}>
    {children}
  </p>
);

interface PatientsPageProps {
  params: Promise<{
    facilityId: string;
  }>;
}

export default function PatientsPage({ params }: PatientsPageProps) {
  // Unwrap the Promise containing params
  const { facilityId } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [facility, setFacility] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const fetchData = () => {
      setLoading(true);
      try {
        const facilityData = getFacilityData(facilityId);
        
        if (!facilityData) {
          console.error('Facility not found');
          setLoading(false);
          return;
        }
        
        setFacility({
          name: facilityData.name,
          address: facilityData.address
        });
        setPatients(facilityData.data.patients);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [facilityId]);
  
  // Filter patients based on search query
  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) ||
           patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (patient.contact?.email && patient.contact.email.toLowerCase().includes(searchQuery.toLowerCase()));
  });
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!facility) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Facility not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">
            {facility.name}
          </p>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Patient List</CardTitle>
          <CardDescription>
            {filteredPatients.length} {filteredPatients.length === 1 ? 'patient' : 'patients'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {filteredPatients.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">No patients found</p>
            ) : (
              filteredPatients.map((patient) => (
                <div key={patient.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {patient.first_name} {patient.last_name}
                      </div>
                      <div className="flex space-x-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center">
                          <UserCircle2 className="h-3.5 w-3.5 mr-1" />
                          ID: {patient.id}
                        </div>
                        {patient.dob && (
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            DOB: {patient.dob}
                          </div>
                        )}
                        {patient.gender && (
                          <div>Gender: {patient.gender}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link 
                        href={`/protected/facilities/${facilityId}/patients/${patient.id}`} 
                        passHref
                      >
                        <Button outline className="flex items-center gap-1">
                          <UserCircle2 className="h-4 w-4" />
                          Profile
                        </Button>
                      </Link>
                      <Link 
                        href={`/protected/facilities/${facilityId}/patients/${patient.id}/evaluations`} 
                        passHref
                      >
                        <Button className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          Evaluations
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
