import { createXai } from '@ai-sdk/xai';
import { CoreMessage, streamText, createDataStreamResponse } from 'ai';
import { mapBuilderToolDefinitions } from '../../pages/apps/map-builder/components/chat/map-builder-tools';
import { settingsManager } from '../../helpers/ipc/settings/settings-listeners';
import { systemPrompt } from './system-prompt';

export async function chatApi({ messages }: { messages: CoreMessage[] }) {
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
            model: model("grok-3-mini-fast"),
            system: systemPrompt,
            messages: messages,
            tools: mapBuilderToolDefinitions,
            maxSteps: 50,
          });
          result.mergeIntoDataStream(dataStream, {
            sendReasoning: true,
          });
          await result.text;
        } catch (streamError) {
          throw streamError;
        }
      },
    });
  } catch (error) {
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
