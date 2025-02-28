export async function GET(request: Request) {
    const encoder = new TextEncoder();
  
    const stream = new ReadableStream({
      start(controller) {
        // Simulated events queue
        const events = [
          {
            event: "thread.created",
            data: { id: "thread_123", object: "thread", info: "New thread created" },
          },
          {
            event: "thread.run.created",
            data: { id: "run_123", object: "run", status: "created" },
          },
          {
            event: "thread.message.delta",
            data: {
              id: "msg_123",
              object: "thread.message.delta",
              delta: {
                content: [
                  {
                    index: 0,
                    type: "text",
                    text: { value: "Hello", annotations: [] },
                  },
                ],
              },
            },
          },
          {
            event: "thread.run.step.delta",
            data: {
              id: "step_123",
              object: "thread.run.step.delta",
              delta: {
                step_details: {
                  type: "tool_calls",
                  tool_calls: [
                    {
                      index: 0,
                      id: "call_123",
                      type: "code_interpreter",
                      code_interpreter: { input: "", outputs: [] },
                    },
                  ],
                },
              },
            },
          },
        ];
  
        let index = 0;
        const interval = setInterval(() => {
          if (index >= events.length) {
            // Signal end of stream
            controller.enqueue(encoder.encode(`event: done\ndata: [DONE]\n\n`));
            clearInterval(interval);
            controller.close();
            return;
          }
          const current = events[index];
          // Format: event, data, double newline at the end
          const eventString = `event: ${current.event}\ndata: ${JSON.stringify(
            current.data
          )}\n\n`;
          controller.enqueue(encoder.encode(eventString));
          index++;
        }, 1000);
      },
      cancel() {
        console.log("Client disconnected");
      },
    });
  
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }
  