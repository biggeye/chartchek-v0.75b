'use client'

import { Suspense, useEffect, useState } from 'react';
import MetricCard from '@/components/ui/metric-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, BrainCircuit, MessageSquare, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
// Import components as needed for future implementation
// import RecentConversations from '@/components/dashboard/RecentConversations';
// import DocumentInsightsPreview from '@/components/dashboard/DocumentInsights';

export default function ProtectedPage() {
  const [metrics, setMetrics] = useState({ 
    activeConversations: 0, 
    insightsGenerated: 0, 
    newMessages: 0, 
    documentsAnalyzed: 0 
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Placeholder for future API implementation
    const fetchMetrics = async () => {
      try {
        // Future implementation: Replace with actual API calls
        // Example: const response = await fetch('/api/metrics');
        // const data = await response.json();
        
        // For now, just use placeholder data
        const placeholderMetrics = {
          activeConversations: 5,
          insightsGenerated: 12,
          newMessages: 8,
          documentsAnalyzed: 24
        };
        
        setMetrics(placeholderMetrics);
      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-8 p-6">
      {/* Welcome Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground">
          Here's what's happening with your behavioral health insights
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          icon={<Activity className="h-6 w-6" />}
          title="Active Conversations"
          value={isLoading ? "Loading..." : String(metrics.activeConversations)}
          delta="+2 from last week"
        />
        <MetricCard
          icon={<BrainCircuit className="h-6 w-6" />}
          title="AI Insights Generated"
          value={isLoading ? "Loading..." : String(metrics.insightsGenerated)}
          delta="15% increase"
        />
        <MetricCard
          icon={<MessageSquare className="h-6 w-6" />}
          title="New Messages"
          value={isLoading ? "Loading..." : String(metrics.newMessages)}
          delta="3 unread"
        />
        <MetricCard
          icon={<FileText className="h-6 w-6" />}
          title="Documents Analyzed"
          value={isLoading ? "Loading..." : String(metrics.documentsAnalyzed)}
          delta="8 new today"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold">Quick Actions</h3>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button outline className="h-24">
                Start New Analysis
              </Button>
              <Button outline className="h-24">
                Upload Documents
              </Button>
            </CardContent>
          </Card>
          
          <Suspense fallback={<div>Loading insights...</div>}>
            {/* Placeholder for DocumentInsightsPreview component */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Document Insights</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Document insights will be displayed here</p>
              </CardContent>
            </Card>
          </Suspense>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Placeholder for RecentConversations component */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Recent Conversations</h3>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Recent conversations will be displayed here</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
