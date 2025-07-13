import { ipcMain, WebContents } from 'electron';
import { AI_SEND_MESSAGE_CHANNEL, AI_STREAM_CHUNK_CHANNEL, AI_STREAM_END_CHANNEL, AI_STREAM_ERROR_CHANNEL } from './ai-channels';
import { chatApi } from '@/api/ai';

export function addAIEventListeners() {
  ipcMain.handle(AI_SEND_MESSAGE_CHANNEL, async (event, { messages, requestId }) => {
    try { 
      const response = await chatApi({ messages });
      
      // Get the stream from the response body
      const stream = response.body;
      if (!stream) {
        throw new Error('No stream in response body');
      }
      
      const reader = stream.getReader();
      const webContents = event.sender;
      
      // Process stream chunks as they arrive
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              webContents.send(AI_STREAM_END_CHANNEL, { requestId });
              break;
            }
            
            // Send chunk to renderer
            webContents.send(AI_STREAM_CHUNK_CHANNEL, { 
              requestId, 
              chunk: value 
            });
          }
        } catch (error) {
          webContents.send(AI_STREAM_ERROR_CHANNEL, { 
            requestId, 
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      };
      
      // Start processing stream (don't await - let it run async)
      processStream();
      
      // Return immediately to indicate streaming has started
      return { success: true, requestId };
    } catch (error) {
      throw error;
    }
  });
}