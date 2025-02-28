'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Calendar, Users } from "lucide-react";
import { getRecentConversations } from '@/lib/kipu';

type Conversation = {
  id: string;
  title: string;
  lastMessage: string;
  date: string;
  type: string;
  unread: boolean;
};

export default function RecentConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const recentConversations = getRecentConversations();
      setConversations(recentConversations);
    } catch (error) {
      console.error("Error fetching recent conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper function to format the date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  // Helper function to get icon based on type
  const getIconForType = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-5 w-5 text-muted-foreground" />;
      case 'group':
        return <Users className="h-5 w-5 text-muted-foreground" />;
      default:
        return <MessageSquare className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="font-medium">Recent Conversations</h3>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Recent Conversations</h3>
      <div className="space-y-2">
        {conversations.length > 0 ? (
          conversations.map((conversation) => (
            <div 
              key={conversation.id} 
              className={`flex items-center gap-3 p-3 hover:bg-muted rounded-lg ${conversation.unread ? 'bg-muted/50' : ''}`}
            >
              {getIconForType(conversation.type)}
              <div>
                <p className="text-sm">{conversation.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(conversation.date).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No recent conversations</p>
        )}
      </div>
    </div>
  );
}
