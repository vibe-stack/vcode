import { createXai } from '@ai-sdk/xai';
import { CoreMessage, streamText, createDataStreamResponse } from 'ai';
import { tools } from '../../pages/workspace/components/chat/tools';
import { settingsManager } from '../../helpers/ipc/settings/settings-listeners';

export async function chatApi({ messages }: { messages: CoreMessage[] }) {
  // Process messages to handle file:// URLs in attachments
  const processedMessages = messages.map((message, index) => {
    if ((message as any).experimental_attachments) {
      const attachments = (message as any).experimental_attachments;
      // Convert file:// URLs to inline content
      const processedAttachments = attachments.map((attachment: any) => {
        // If it's a file:// URL, we need to convert it to a data URL format
        if (attachment.url && attachment.url.startsWith('file://')) {
          // Convert file content to data URL format for AI SDK compatibility
          const base64Content = Buffer.from(attachment.content || '', 'utf-8').toString('base64');
          return {
            name: attachment.name,
            contentType: attachment.contentType,
            url: `data:${attachment.contentType};base64,${base64Content}`
          };
        }
        return attachment;
      });
      return {
        ...message,
        experimental_attachments: processedAttachments
      };
    } else {
      return message;
    }
  });
  
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
            messages: processedMessages,
            tools,
            maxSteps: 10,
            maxTokens: 10000,
          });
          result.mergeIntoDataStream(dataStream);
          await result.text;
        } catch (streamError) {
          throw streamError;
        }
      },
    });
  } catch (error) {
    throw new Error("Failed to generate AI response");
  }
}