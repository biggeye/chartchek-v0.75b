"use client";
import { useEffect, useState } from "react";

interface EventData {
  event: string;
  data: any;
}

export default function SSEAdvancedClient() {
  const [events, setEvents] = useState<EventData[]>([]);

  useEffect(() => {
    const evtSource = new EventSource("/api/sse-advanced");

    // A helper to process incoming events
    const handleEvent = (event: MessageEvent, eventType: string) => {
      console.log(`Received event ${eventType}:`, event.data);
      const parsed = JSON.parse(event.data);
      setEvents((prev) => [...prev, { event: eventType, data: parsed }]);
      // You can add conditional logic here to update your UI differently per event type
    };

    // Listen for known event types
    evtSource.addEventListener("thread.created", (e) =>
      handleEvent(e as MessageEvent, "thread.created")
    );
    evtSource.addEventListener("thread.run.created", (e) =>
      handleEvent(e as MessageEvent, "thread.run.created")
    );
    evtSource.addEventListener("thread.message.delta", (e) =>
      handleEvent(e as MessageEvent, "thread.message.delta")
    );
    evtSource.addEventListener("thread.run.step.delta", (e) =>
      handleEvent(e as MessageEvent, "thread.run.step.delta")
    );
    // Fallback for any unhandled messages
    evtSource.onmessage = (event) => {
      // This might catch messages without an "event:" field
      handleEvent(event, "default");
    };

    // Listen for the 'done' event to gracefully end the connection
    evtSource.addEventListener("done", (e) => {
      console.log("Stream complete:", e.data);
      evtSource.close();
    });

    evtSource.onerror = (error) => {
      console.error("EventSource encountered an error:", error);
      evtSource.close();
    };

    return () => {
      evtSource.close();
    };
  }, []);

  return (
    <div>
      <h1>Advanced SSE Client</h1>
      <ul>
        {events.map((ev, idx) => (
          <li key={idx}>
            <strong>{ev.event}</strong>:{" "}
            <pre style={{ display: "inline" }}>
              {JSON.stringify(ev.data, null, 2)}
            </pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
