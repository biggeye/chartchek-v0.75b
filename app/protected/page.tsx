'use client'

import { Suspense, useEffect, useState } from 'react';
import MetricCard from '@/components/metric-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, BrainCircuit, MessageSquare, FileText } from 'lucide-react';
import RecentConversations from '@/components/chat/recent-conversations';
import DocumentInsightsPreview from '@/components/documents/insights-preview';
import { getMetrics, getPatientStats, getDocumentInsights, getRecentConversations } from '@/lib/kipu';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ProtectedPage() {
  const [metrics, setMetrics] = useState({ 
    activeConversations: 0, 
    insightsGenerated: 0, 
    newMessages: 0, 
    documentsAnalyzed: 0 
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real application, this would be an API call
    // For now, we're using our mock data utility functions
    try {
      const kipuMetrics = getMetrics();
      setMetrics(kipuMetrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setIsLoading(false);
    }
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
            <DocumentInsightsPreview />
          </Suspense>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
  
          <RecentConversations />
        </div>
      </div>
    </div>
  );
}
