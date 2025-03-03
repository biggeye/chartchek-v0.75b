// components/insights/BillingInsights.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getBillingInsights } from '@/lib/kipu';
import { Loader2 } from 'lucide-react';

export function BillingInsights() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const data = await getBillingInsights();
        setInsights(data);
      } catch (error) {
        console.error('Error fetching billing insights:', error);
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
    return <div>No billing data available</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-semibold">Billing Dashboard</h2>
      
      <Card>
        <CardHeader className="pb-2">
          <title className="text-sm font-medium">Insurance Breakdown</title>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {insights.insurancePlans.map((plan: any) => (
              <div key={plan.type} className="flex justify-between items-center">
                <span className="text-sm">{plan.type}</span>
                <span className="text-sm font-medium">{plan.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <title className="text-sm font-medium">Authorization Summary</title>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Days Authorized</span>
              <span className="text-sm font-medium">{insights.totalDaysAuthorized}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Days Remaining</span>
              <span className="text-sm font-medium">{insights.daysRemaining}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <title className="text-sm font-medium">Upcoming Reviews</title>
        </CardHeader>
        <CardContent>
          {insights.upcomingReviews.length > 0 ? (
            <div className="space-y-2">
              {insights.upcomingReviews.map((review: any) => (
                <div key={review.id} className="text-sm">
                  <div className="font-medium">{review.patientName}</div>
                  <div className="text-muted-foreground">{review.date}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No upcoming reviews</div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <title className="text-sm font-medium">Financial Status</title>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Outstanding Payments</span>
              <span className="text-sm font-medium">${insights.outstandingPayments.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Active Appeals</span>
              <span className="text-sm font-medium">{insights.activeAppeals}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Claims to Appeal</span>
              <span className="text-sm font-medium">{insights.claimsToAppeal}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}