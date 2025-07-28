import { ipcMain } from 'electron';
import { 
  MAP_BUILDER_SEND_MESSAGE_CHANNEL, 
  MAP_BUILDER_STREAM_CHUNK_CHANNEL, 
  MAP_BUILDER_STREAM_END_CHANNEL, 
  MAP_BUILDER_STREAM_ERROR_CHANNEL 
} from './map-builder-channels';
import { chatApi } from '@/api/general-agent';

export function addMapBuilderEventListeners() {
  ipcMain.handle(MAP_BUILDER_SEND_MESSAGE_CHANNEL, async (event, { messages, requestId, agentType, systemPrompt, maxSteps }) => {
    try { 
      console.log('Map builder: Processing message request with ID:', requestId);
      const response = await chatApi({ 
        messages, 
        agentType: agentType || 'mapBuilder',
        systemPrompt,
        maxSteps
      });
      
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
              console.log('Map builder: Stream ended for request:', requestId);
              webContents.send(MAP_BUILDER_STREAM_END_CHANNEL, { requestId });
              break;
            }
            
            // Send chunk to renderer
            webContents.send(MAP_BUILDER_STREAM_CHUNK_CHANNEL, { 
              requestId, 
              chunk: value 
            });
          }
        } catch (error) {
          console.error('Map builder: Stream processing error for request:', requestId, error);
          webContents.send(MAP_BUILDER_STREAM_ERROR_CHANNEL, { 
            requestId, 
            error: error instanceof Error ? error.message : 'Unknown stream error'
          });
        }
      };
      
      // Start processing stream (don't await - let it run async)
      processStream();
      
      // Return immediately to indicate streaming has started
      return { success: true, requestId };
    } catch (error) {
      console.error('Map builder: IPC handler error for request:', requestId, error);
      // Send error to renderer immediately
      event.sender.send(MAP_BUILDER_STREAM_ERROR_CHANNEL, { 
        requestId, 
        error: error instanceof Error ? error.message : 'Unknown IPC error'
      });
      throw error;
    }
  });
}
