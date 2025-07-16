// Custom fetcher that works with Electron's IPC system for agents
export const agentFetch = async (input: RequestInfo | URL, init?: RequestInit, taskId?: string) => {
  try {
    const body = JSON.parse(init?.body as string);
    const requestId = crypto.randomUUID();

    const stream = new ReadableStream({
      start(controller) {
        const handleChunk = (data: { taskId: string, requestId: string, chunk: Uint8Array }) => {
          if (data.requestId === requestId && data.taskId === taskId) {
            controller.enqueue(data.chunk);
          }
        };
        
        const handleEnd = (data: { taskId: string, requestId: string }) => {
          if (data.requestId === requestId && data.taskId === taskId) {
            controller.close();
          }
        };
        
        const handleError = (data: { taskId: string, requestId: string, error: string }) => {
          if (data.requestId === requestId && data.taskId === taskId) {
            controller.error(new Error(data.error));
          }
        };
        
        window.agents.onStreamChunk(handleChunk);
        window.agents.onStreamEnd(handleEnd);
        window.agents.onStreamError(handleError);
        
        // Start the AI request for this specific task
        const requestData = { 
          taskId: taskId || '',
          messages: body.messages, 
          requestId,
        };
        
        window.agents.sendMessage(requestData)
          .then(response => {
            // noop
          })
          .catch(error => {
            console.error("Agent request error:", error);
            controller.error(error);
          });
      },
      
      cancel() {
        window.agents.removeAllListeners();
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