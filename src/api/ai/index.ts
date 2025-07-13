import { createXai } from '@ai-sdk/xai';
import { CoreMessage, streamText, createDataStreamResponse } from 'ai';
import { tools } from '../../pages/workspace/components/chat/tools';

const model = createXai({
})

export async function chatApi({ messages }: { messages: CoreMessage[] }) {
  console.log("received on api side, calling streamtext");
  
  try {
    return createDataStreamResponse({
      execute: async (dataStream) => {
        const result = streamText({
          model: model("grok-4-0709"),
          messages,
          tools,
          maxSteps: 10,
          maxTokens: 10000,
        });

        result.mergeIntoDataStream(dataStream);
        const txt = await result.text;
        console.log("merged into data stream", txt);
      },
    });
  } catch (error) {
    console.error("Error in AI API:", error);
    throw new Error("Failed to generate AI response");
  }
}