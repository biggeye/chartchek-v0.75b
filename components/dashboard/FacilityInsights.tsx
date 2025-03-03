// components/dashboard/FacilityInsights.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getFacilityInsights } from '@/lib/kipu';
import { Loader2, AlertTriangle } from 'lucide-react';

export function FacilityInsights() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const data = await getFacilityInsights();
        setInsights(data);
      } catch (error) {
        console.error('Error fetching facility insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!insights) {
    return <div>No facility data available</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-semibold">Facility Dashboard</h2>
      
      <Card>
        <CardHeader className="pb-2">
          <title className="text-sm font-medium">Census Overview</title>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Current Census</span>
              <span className="text-sm font-medium">{insights.currentCensus}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Bed Capacity</span>
              <span className="text-sm font-medium">{insights.bedCapacity}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Occupancy Rate</span>
              <span className="text-sm font-medium">{insights.occupancyRate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <title className="text-sm font-medium">Recent Activity</title>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Admissions (Last 7 Days)</span>
              <span className="text-sm font-medium">{insights.recentAdmissions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Discharges (Last 7 Days)</span>
              <span className="text-sm font-medium">{insights.recentDischarges}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Upcoming Admissions</span>
              <span className="text-sm font-medium">{insights.upcomingAdmissions}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <title className="text-sm font-medium">Staff Coverage</title>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Staff On Duty</span>
              <span className="text-sm font-medium">{insights.staffOnDuty}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Patient-to-Staff Ratio</span>
              <span className="text-sm font-medium">{insights.patientToStaffRatio}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {insights.alerts && insights.alerts.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader className="pb-2">
            <title className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
              Critical Alerts
            </title>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.alerts.map((alert: any, index: number) => (
                <div key={index} className="text-sm text-red-700">
                  {alert}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}