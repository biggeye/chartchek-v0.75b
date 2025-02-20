import { MessageSquare } from "lucide-react";

export default function RecentConversations() {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Recent Conversations</h3>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm">Assessment Follow-up</p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
