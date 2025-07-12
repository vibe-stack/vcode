import { CoreMessage } from "ai";
import { AI_SEND_MESSAGE_CHANNEL, AI_STREAM_CHUNK_CHANNEL, AI_STREAM_END_CHANNEL, AI_STREAM_ERROR_CHANNEL } from "./ai-channels";

export function exposeAIContext() {
    const { contextBridge, ipcRenderer } = window.require("electron");

    contextBridge.exposeInMainWorld("ai", {
        sendMessage: (payload: { messages: CoreMessage[], requestId: string }) => 
            ipcRenderer.invoke(AI_SEND_MESSAGE_CHANNEL, payload),
        
        onStreamChunk: (callback: (data: { requestId: string, chunk: Uint8Array }) => void) => {
            ipcRenderer.on(AI_STREAM_CHUNK_CHANNEL, (_event: any, data: any) => callback(data));
        },
        
        onStreamEnd: (callback: (data: { requestId: string }) => void) => {
            ipcRenderer.on(AI_STREAM_END_CHANNEL, (_event: any, data: any) => callback(data));
        },
        
        onStreamError: (callback: (data: { requestId: string, error: string }) => void) => {
            ipcRenderer.on(AI_STREAM_ERROR_CHANNEL, (_event: any, data: any) => callback(data));
        },
        
        removeAllListeners: () => {
            ipcRenderer.removeAllListeners(AI_STREAM_CHUNK_CHANNEL);
            ipcRenderer.removeAllListeners(AI_STREAM_END_CHANNEL);
            ipcRenderer.removeAllListeners(AI_STREAM_ERROR_CHANNEL);
        }
    });
}