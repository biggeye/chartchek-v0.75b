'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Building, Users, FileText, ArrowRight } from 'lucide-react';
import { listFacilities } from '@/lib/kipu';

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

const CardFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex items-center p-6 pt-0 ${className || ''}`} {...props}>
    {children}
  </div>
);

interface FacilityUI {
  facility_id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  patients_count: number;
  documents_count: number;
}

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<FacilityUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacilities = () => {
      try {
        const facilitiesData = listFacilities();
        
        // Map the data to the format we need for the UI
        const formattedFacilities = facilitiesData.map((facility) => ({
          facility_id: facility.facility_id,
          name: facility.name,
          address: facility.address,
          phone: facility.phone,
          email: facility.email,
          patients_count: facility.meta?.patients_count || 0,
          documents_count: facility.meta?.documents_count || 0
        }));
        
        setFacilities(formattedFacilities);
      } catch (error) {
        console.error('Error fetching facilities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Facilities</h1>
        <p className="text-muted-foreground">
          Select a facility to view its patients and records
        </p>
      </div>

      {facilities.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg">
          <Building className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No facilities found</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            There are no facilities available in the database. Please check your connection or try again later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((facility) => (
            <Link 
              href={`/protected/facilities/${facility.facility_id}/patients`} 
              key={facility.facility_id}
              className="block transition-transform hover:scale-[1.02]"
            >
              <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{facility.name}</CardTitle>
                  <CardDescription>
                    {facility.address}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="text-muted-foreground">Patients:</span>
                      </div>
                      <span className="font-medium">{facility.patients_count}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm">
                        <FileText className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="text-muted-foreground">Documents:</span>
                      </div>
                      <span className="font-medium">{facility.documents_count}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button outline className="w-full">
                    <span>View Details</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
