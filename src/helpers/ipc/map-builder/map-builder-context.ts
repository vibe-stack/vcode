import { CoreMessage } from "ai";
import { 
  MAP_BUILDER_SEND_MESSAGE_CHANNEL, 
  MAP_BUILDER_STREAM_CHUNK_CHANNEL, 
  MAP_BUILDER_STREAM_END_CHANNEL, 
  MAP_BUILDER_STREAM_ERROR_CHANNEL 
} from "./map-builder-channels";

export function exposeMapBuilderContext() {
    const { contextBridge, ipcRenderer } = window.require("electron");

    contextBridge.exposeInMainWorld("mapBuilderAI", {
        sendMessage: (payload: { messages: CoreMessage[], requestId: string }) => 
            ipcRenderer.invoke(MAP_BUILDER_SEND_MESSAGE_CHANNEL, payload),
        
        onStreamChunk: (callback: (data: { requestId: string, chunk: Uint8Array }) => void) => {
            ipcRenderer.on(MAP_BUILDER_STREAM_CHUNK_CHANNEL, (_event: any, data: any) => callback(data));
        },
        
        onStreamEnd: (callback: (data: { requestId: string }) => void) => {
            ipcRenderer.on(MAP_BUILDER_STREAM_END_CHANNEL, (_event: any, data: any) => callback(data));
        },
        
        onStreamError: (callback: (data: { requestId: string, error: string }) => void) => {
            ipcRenderer.on(MAP_BUILDER_STREAM_ERROR_CHANNEL, (_event: any, data: any) => callback(data));
        },
        
        removeAllListeners: () => {
            ipcRenderer.removeAllListeners(MAP_BUILDER_STREAM_CHUNK_CHANNEL);
            ipcRenderer.removeAllListeners(MAP_BUILDER_STREAM_END_CHANNEL);
            ipcRenderer.removeAllListeners(MAP_BUILDER_STREAM_ERROR_CHANNEL);
        }
    });
}
