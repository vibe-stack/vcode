import { createXai } from '@ai-sdk/xai';
import { CoreMessage, streamText, createDataStreamResponse } from 'ai';
import { mapBuilderToolDefinitions } from '../../pages/apps/map-builder/components/chat/map-builder-tools';
import { settingsManager } from '../../helpers/ipc/settings/settings-listeners';
import { systemPrompt } from './system-prompt';

export async function chatApi({ messages }: { messages: CoreMessage[] }) {
  console.log("Map builder API: Processing messages", messages.length);

  try {
    // Get XAI API key from secure settings
    const xaiApiKey = await settingsManager.getSecure('apiKeys.xai');
    if (!xaiApiKey) {
      const errorMsg = 'XAI API key not found. Please configure your API key in Settings > AI & Agents.';
      console.error('Map builder API: Missing XAI API key');
      throw new Error(errorMsg);
    }
    
    console.log('Map builder API: XAI API key found, creating model');
    const model = createXai({
      apiKey: xaiApiKey,
    });
    
    console.log('Map builder API: Creating data stream response');
    return createDataStreamResponse({
      execute: async (dataStream) => {
        try {
          console.log('Map builder API: Starting streamText with', messages.length, 'messages');
          const result = streamText({
            model: model("grok-4-0709"),
            system: systemPrompt,
            messages: messages,
            tools: mapBuilderToolDefinitions,
            maxSteps: 50,
            // maxSteps: 10,
            // maxTokens: 10000,
          });

          console.log('Map builder API: Merging into data stream');
          result.mergeIntoDataStream(dataStream, {
            sendReasoning: true, // Enable reasoning tokens to be sent to client
          });
          
          const resultText = await result.text;
          console.log('Map builder API: Stream completed successfully');
        } catch (streamError) {
          console.error("Map builder API: Stream error:", streamError);
          console.error("Map builder API: Stream error stack:", streamError instanceof Error ? streamError.stack : 'No stack trace');
          throw streamError;
        }
      },
    });
  } catch (error) {
    console.error('Map builder API: Top-level error:', error);
    console.error('Map builder API: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}