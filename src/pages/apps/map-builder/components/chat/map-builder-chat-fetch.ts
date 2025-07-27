export async function mapBuilderChatFetch(input: RequestInfo | URL, init: RequestInit = {}) {
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
                
                window.mapBuilderAI.onStreamChunk(handleChunk);
                window.mapBuilderAI.onStreamEnd(handleEnd);
                window.mapBuilderAI.onStreamError(handleError);

                // Send the message via IPC
                const requestData = { 
                    messages, 
                    requestId,
                };
                
                window.mapBuilderAI.sendMessage(requestData)
                    .then(response => {
                        console.log("Map builder AI request sent successfully", response);
                    })
                    .catch((error) => {
                        console.error("Map builder AI request error:", error);
                        controller.error(error);
                    });
            },

            cancel() {
                // Clean up listeners when stream is cancelled
                window.mapBuilderAI.removeAllListeners();
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
        console.error('Map builder chat fetch error:', error);
        throw error;
    }
}
