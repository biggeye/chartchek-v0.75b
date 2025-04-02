// app/protected/facilities/[facilityId]/page.tsx
'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFacilityStore } from '@/store/facilityStore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Users, Calendar, FileCheck, AlertCircle, Activity } from 'lucide-react';
import Link from 'next/link';

export default function FacilityDetailPage() {
  const params = useParams();
  const facilityId = Number(params.facilityId);
  
  const { facilities, isLoading, error, fetchFacilities, setCurrentFacilityId } = useFacilityStore();
  
  // Find the current facility
  const facility = facilities.find(f => f.id === facilityId);
  
  useEffect(() => {
    fetchFacilities();
    if (facilityId) {
      setCurrentFacilityId(facilityId);
    }
  }, [fetchFacilities, facilityId, setCurrentFacilityId]);

  if (isLoading) {
    return <div className="container py-6">Loading facility details...</div>;
  }

  if (error) {
    return <div className="container py-6 text-red-500">{error}</div>;
  }

  if (!facility) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Facility Not Found</h1>
        <p>The facility with ID {facilityId} could not be found.</p>
        <Link href="/protected/facilities">
          <Button className="mt-4">Back to Facilities</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <ScrollArea className="h-full w-full overflow-y-auto mb-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">{facility.name}</h1>
          <Link href="/protected/facilities">
            <Button variant="outline">Back to Facilities</Button>
          </Link>
        </div>
        
        {/* Facility Metrics */}
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
                  <h3 className="text-2xl font-bold text-green-700">Mar 30</h3>
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
        
        {/* Facility Performance */}
        <Card className="mb-6">
          <CardHeader>
            Facility Performance
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-100 rounded-md">
              <p className="text-muted-foreground">Performance metrics visualization</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Additional Facility Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
             Patient Demographics
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center bg-gray-100 rounded-md">
                <p className="text-muted-foreground">Demographics visualization</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
           Upcoming Events
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">Staff Meeting</p>
                  <p className="text-sm text-muted-foreground">March 28th at 9 AM</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">Utilization Review</p>
                  <p className="text-sm text-muted-foreground">March 30th at 2 PM</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}