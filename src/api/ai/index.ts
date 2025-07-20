import { createXai } from '@ai-sdk/xai';
import { CoreMessage, streamText, createDataStreamResponse } from 'ai';
import { toolRegistry } from '../../pages/workspace/components/chat/tools';
import { settingsManager } from '../../helpers/ipc/settings/settings-listeners';
import { systemPrompt } from './system-prompt';

export async function chatApi({ messages }: { messages: CoreMessage[] }) {
  console.log("hit the api route", messages);

  try {
    // Get XAI API key from secure settings
    const xaiApiKey = await settingsManager.getSecure('apiKeys.xai');
    if (!xaiApiKey) {
      throw new Error('XAI API key not found. Please configure your API key in Settings > AI & Agents.');
    }
    const model = createXai({
      apiKey: xaiApiKey,
    });
    return createDataStreamResponse({
      execute: async (dataStream) => {
        try {
          const result = streamText({
            model: model("grok-4-0709"),
            system: systemPrompt,
            messages: messages,
            tools: toolRegistry.getTools(),
            maxSteps: 50,
            // maxSteps: 10,
            // maxTokens: 10000,
          });

          result.mergeIntoDataStream(dataStream, {
            sendReasoning: true, // Enable reasoning tokens to be sent to client
          });
          await result.text;
        } catch (streamError) {
          console.error("Stream error:", streamError);
          throw streamError;
        }
      },
    });
  } catch (error) {
    console.error('AI API Error:', error);
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}