// Custom fetcher that works with Electron's IPC system
export const chatFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
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
        
        window.ai.onStreamChunk(handleChunk);
        window.ai.onStreamEnd(handleEnd);
        window.ai.onStreamError(handleError);
        
        // Start the AI request
        window.ai.sendMessage({ messages: body.messages, requestId })
          .then(response => {
            // noop
          })
          .catch(error => {
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