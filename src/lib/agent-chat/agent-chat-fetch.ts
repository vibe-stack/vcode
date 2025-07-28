export function createAgentChatFetch(agentName: string, agentConfig?: any, ipcHandler?: any) {
  return async function agentChatFetch(input: RequestInfo | URL, init: RequestInit = {}) {
    try {
      // Parse the request body to get messages
      const body = JSON.parse(init.body as string);
      const messages = body.messages;

      // Generate a unique request ID
      const requestId = crypto.randomUUID();

      // Create a readable stream
      const stream = new ReadableStream({
        start(controller) {
          const handleChunk = (data: { requestId: string, chunk: Uint8Array }) => {
            const chunkString = new TextDecoder().decode(data.chunk);
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
          
          // Use custom IPC handler if provided, otherwise fallback to window global
          // For mapBuilder, use the existing mapBuilderAI handler
          const handlerName = agentName === 'mapBuilder' ? 'mapBuilderAI' : `${agentName}AI`;
          const handler = ipcHandler || (window as any)[handlerName];
          if (!handler) {
            controller.error(new Error(`No IPC handler found for agent: ${agentName} (looking for ${handlerName})`));
            return;
          }

          handler.onStreamChunk(handleChunk);
          handler.onStreamEnd(handleEnd);
          handler.onStreamError(handleError);

          // Send the message via IPC
          const requestData = { 
            messages, 
            requestId,
            agentType: agentName,
            systemPrompt: agentConfig?.systemPrompt,
            maxSteps: agentConfig?.maxSteps,
          };
          
          handler.sendMessage(requestData)
            .then((response: any) => {
              console.log(`${agentName} AI request sent successfully`, response);
            })
            .catch((error: any) => {
              console.error(`${agentName} AI request error:`, error);
              controller.error(error);
            });
        },

        cancel() {
          // Clean up listeners when stream is cancelled
          const handlerName = agentName === 'mapBuilder' ? 'mapBuilderAI' : `${agentName}AI`;
          const handler = ipcHandler || (window as any)[handlerName];
          if (handler) {
            handler.removeAllListeners();
          }
        }
      });

      // Return a Response object with the stream
      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'X-Vercel-AI-Data-Stream': 'v1',
        }
      });
    } catch (error) {
      console.error(`${agentName} chat fetch error:`, error);
      throw error;
    }
  };
}