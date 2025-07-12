import { createXai } from '@ai-sdk/xai';
import { CoreMessage, generateText, streamText } from 'ai';

const model = createXai({
  apiKey: "",
})

export async function chatApi({ messages }: { messages: CoreMessage[] }) {
  console.log("received on api side");
  
  try {
    const result = streamText({
      model: model("grok-3-mini"),
      messages,
      maxTokens: 10000,
    });

    console.log("returning result");
    return result.toDataStream();
  } catch (error) {
    console.error("Error in AI API:", error);
    throw new Error("Failed to generate AI response");
  }
}