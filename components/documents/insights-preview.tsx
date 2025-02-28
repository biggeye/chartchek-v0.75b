'use client';

import { useEffect, useState } from 'react';
import { getDocumentInsights } from '@/lib/kipu';

type Insight = {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  relevantPatients: number;
};

export default function DocumentInsightsPreview() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const documentInsights = getDocumentInsights();
      setInsights(documentInsights);
    } catch (error) {
      console.error("Error fetching document insights:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="font-medium">Document Insights</h3>
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Document Insights</h3>
      <div className="space-y-3 text-sm">
        {insights.length > 0 ? (
          insights.map((insight) => (
            <div key={insight.id} className="p-4 rounded-lg bg-muted">
              <h4 className="font-medium mb-1">{insight.title}</h4>
              <p className="mb-2">{insight.description}</p>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Category: {insight.category}</span>
                <span>Relevant patients: {insight.relevantPatients}</span>
                <span>{new Date(insight.date).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">No insights available</p>
        )}
      </div>
    </div>
  );
}
