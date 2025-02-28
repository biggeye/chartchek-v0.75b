export async function GET(request: Request) {
    const encoder = new TextEncoder();
  
    const stream = new ReadableStream({
      start(controller) {
        const push = () => {
          // Create an SSE formatted string with the current time
          const eventString = `data: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`;
          controller.enqueue(encoder.encode(eventString));
          // Push a new event every second
          setTimeout(push, 1000);
        };
  
        push();
      },
      cancel() {
        console.log("SSE client disconnected");
      },
    });
  
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }
  