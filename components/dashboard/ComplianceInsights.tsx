// components/dashboard/ComplianceInsights.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getComplianceInsights } from '@/lib/kipu';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export function ComplianceInsights() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const data = await getComplianceInsights();
        setInsights(data);
      } catch (error) {
        console.error('Error fetching compliance insights:', error);
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
    return <div>No compliance data available</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-semibold">Compliance Dashboard</h2>
      
      <Card>
        <CardHeader className="pb-2">
          <span className="text-sm font-medium">Documentation Status</span>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Complete</span>
              <span className="text-sm font-medium text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                {insights.documentationStatus.complete}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Pending</span>
              <span className="text-sm font-medium text-amber-600">
                {insights.documentationStatus.pending}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Overdue</span>
              <span className="text-sm font-medium text-red-600 flex items-center">
                <XCircle className="h-4 w-4 mr-1" />
                {insights.documentationStatus.overdue}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <span className="text-sm font-medium">Upcoming Deadlines</span>
        </CardHeader>
        <CardContent>
          {insights.upcomingDeadlines.length > 0 ? (
            <div className="space-y-2">
              {insights.upcomingDeadlines.map((deadline: any, index: number) => (
                <div key={index} className="text-sm">
                  <div className="font-medium">{deadline.title}</div>
                  <div className="text-muted-foreground">Due: {deadline.date}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No upcoming deadlines</div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <span className="text-sm font-medium">Staff Certifications</span>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Current</span>
              <span className="text-sm font-medium">{insights.staffCertifications.current}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Expiring Soon</span>
              <span className="text-sm font-medium">{insights.staffCertifications.expiringSoon}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Expired</span>
              <span className="text-sm font-medium">{insights.staffCertifications.expired}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <span className="text-sm font-medium">Audit Readiness</span>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {insights.auditReadiness.map((category: any) => (
              <div key={category.name} className="flex justify-between items-center">
                <span className="text-sm">{category.name}</span>
                <span className={`text-sm font-medium ${
                  category.score >= 90 ? 'text-green-600' : 
                  category.score >= 70 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {category.score}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}