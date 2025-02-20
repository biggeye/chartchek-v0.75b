'use client'

import { Suspense } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, BrainCircuit, MessageSquare, FileText } from 'lucide-react';
import UserStats from '@/components/user-stats';
import RecentConversations from '@/components/chat/recent-conversations';
import DocumentInsightsPreview from '@/components/documents/insights-preview';

export default function ProtectedPage() {
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
          value="12"
          delta="+2 from last week"
        />
        <MetricCard
          icon={<BrainCircuit className="h-6 w-6" />}
          title="AI Insights Generated"
          value="84"
          delta="15% increase"
        />
        <MetricCard
          icon={<MessageSquare className="h-6 w-6" />}
          title="New Messages"
          value="23"
          delta="3 unread"
        />
        <MetricCard
          icon={<FileText className="h-6 w-6" />}
          title="Documents Analyzed"
          value="156"
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
              <Button variant="outline" className="h-24">
                Start New Analysis
              </Button>
              <Button variant="outline" className="h-24">
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
          <UserStats />
          <RecentConversations />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, delta }: { 
  icon: React.ReactNode;
  title: string;
  value: string;
  delta: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              {icon}
              <span className="text-sm">{title}</span>
            </div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
          <span className="text-sm text-green-600">{delta}</span>
        </div>
      </CardContent>
    </Card>
  );
}