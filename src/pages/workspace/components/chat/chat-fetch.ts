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
        
        // Start the AI request with attachments if they exist
        const requestData = { 
          messages: body.messages, 
          requestId,
        };
        
        // Check if any of the recent messages contain context rules
        // and inject them as system context if needed
        let hasContextRules = false;
        for (const message of body.messages.slice(-3)) { // Check last 3 messages
          if (message.role === 'tool' && message.content && 
              message.content.includes('Context Rules for This File')) {
            hasContextRules = true;
            break;
          }
        }
        
        // If context rules were found in recent tool responses, 
        // add a system message to ensure the AI follows them
        if (hasContextRules) {
          requestData.messages = [
            {
              role: 'system',
              content: 'IMPORTANT: You have received context rules in previous tool responses. Please carefully follow any project-specific requirements, coding standards, or rules that were provided. These rules take precedence over general best practices and must be applied to any code you write or modify.'
            },
            ...requestData.messages
          ];
        }
        
        window.ai.sendMessage(requestData)
          .then(response => {
            // noop
            console.log("AI request sent successfully", response);
          })
          .catch(error => {
            console.error("AI request error:", error);
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