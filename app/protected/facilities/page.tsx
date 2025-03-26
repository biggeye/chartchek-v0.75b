// app/protected/facilities/page.tsx
'use client';

import { useEffect } from 'react';
import { useFacilityStore } from '@/store/facilityStore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Building2, Users, Calendar, Activity } from 'lucide-react';
import Link from 'next/link';

export default function FacilitiesPage() {
  const { facilities, isLoading, error, fetchFacilities } = useFacilityStore();

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  return (
    <div className="container py-6">
      <ScrollArea className="h-full w-full overflow-y-auto mb-20">
         
        {/* Enterprise-wide Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Total Facilities</p>
                  <h3 className="text-2xl font-bold text-blue-700">{facilities.length}</h3>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900">Total Census</p>
                  <h3 className="text-2xl font-bold text-green-700">42</h3>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-900">Upcoming Reviews</p>
                  <h3 className="text-2xl font-bold text-amber-700">8</h3>
                </div>
                <Calendar className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-900">Overall Performance</p>
                  <h3 className="text-2xl font-bold text-purple-700">87%</h3>
                </div>
                <Activity className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Facilities List */}
        <Card>
          <CardHeader>
            All Facilities
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-4">Loading facilities...</div>
            ) : error ? (
              <div className="text-red-500 p-4">{error}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {facilities.map((facility) => (
                  <Card key={facility.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{facility.name}</h3>
                          <p className="text-sm text-muted-foreground">ID: {facility.id}</p>
                          <p className="text-sm text-muted-foreground">
                            Status: {facility.enabled ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <Link href={`/protected/facilities/${facility.id}`}>
                          <Button outline>View Details</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </ScrollArea>
    </div>
  );
}