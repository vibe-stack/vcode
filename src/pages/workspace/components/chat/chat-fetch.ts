// Custom fetcher that works with Electron's IPC system
export const chatFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  try {
    // Extract messages from the request body
    const body = JSON.parse(init?.body as string);
    
    // ...existing code...
    
    // Generate a unique request ID
    const requestId = crypto.randomUUID();
    
    // Create a ReadableStream that will be populated with chunks
    const stream = new ReadableStream({
      start(controller) {
        // Set up stream listeners
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
        
        // Register listeners
        window.ai.onStreamChunk(handleChunk);
        window.ai.onStreamEnd(handleEnd);
        window.ai.onStreamError(handleError);
        
        // Start the AI request
        window.ai.sendMessage({ messages: body.messages, requestId })
          .then(response => {
            // Request started successfully
          })
          .catch(error => {
            controller.error(error);
          });
      },
      
      cancel() {
        // Clean up listeners when stream is cancelled
        window.ai.removeAllListeners();
      }
    });
    
    // Return a Response object that the AI SDK can understand
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