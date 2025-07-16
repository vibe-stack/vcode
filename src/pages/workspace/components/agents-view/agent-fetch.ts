// Custom fetcher that works with Electron's IPC system for agents
// This is similar to chat-fetch but uses the agents API endpoint
export const agentFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  try {
    const body = JSON.parse(init?.body as string);
    const requestId = crypto.randomUUID();

    const stream = new ReadableStream({
      start(controller) {
        const handleChunk = (data: { requestId: string, chunk: Uint8Array }) => {
          if (data.requestId === requestId) {
            controller.enqueue(data.chunk);
          }
        };
        
        const handleEnd = (data: { requestId: string }) => {
          if (data.requestId === requestId) {
            controller.close();
          }
        };
        
        const handleError = (data: { requestId: string, error: string }) => {
          if (data.requestId === requestId) {
            controller.error(new Error(data.error));
          }
        };
        
        // Use the same AI context but for agents
        window.ai.onStreamChunk(handleChunk);
        window.ai.onStreamEnd(handleEnd);
        window.ai.onStreamError(handleError);
        
        // Send to agents API instead of chat API
        const requestData = { 
          messages: body.messages, 
          requestId,
          apiType: 'agents' // This tells the backend to use agents API
        };
        
        window.ai.sendMessage(requestData)
          .then(response => {
            // noop
          })
          .catch(error => {
            console.error("Agent request error:", error);
            controller.error(error);
          });
      },
      
      cancel() {
        window.ai.removeAllListeners();
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'X-Vercel-AI-Data-Stream': 'v1',
      },
    });
  } catch (error) {
    throw error;
  }
};
