import { createXai } from "@ai-sdk/xai";
import { CoreMessage, streamText, createDataStreamResponse } from "ai";
import { getAllTools } from "./tools";
import { settingsManager } from "../../helpers/ipc/settings/settings-listeners";
import { systemPrompt } from "./system-prompt";

export async function chatApi({ messages }: { messages: CoreMessage[] }) {
  try {
    // Get XAI API key from secure settings
    const xaiApiKey = await settingsManager.getSecure("apiKeys.xai");
    if (!xaiApiKey) {
      throw new Error(
        "XAI API key not found. Please configure your API key in Settings > AI & Agents.",
      );
    }
    const model = createXai({
      apiKey: xaiApiKey,
    });
    return createDataStreamResponse({
      execute: async (dataStream) => {
        try {
          // Get tools asynchronously to include MCP tools
          const availableTools = await getAllTools();
          console.log('[AI API] Loaded', Object.keys(availableTools).length, 'tools for AI:', Object.keys(availableTools));
          console.log('[AI API] Tool descriptions:', Object.entries(availableTools).map(([name, tool]) => ({ name, description: tool.description })));
          
          const result = streamText({
            model: model("grok-4-0709"),
            system: systemPrompt,
            messages: messages,
            tools: availableTools,
            maxSteps: 50,
            // maxSteps: 10,
            // maxTokens: 10000,
          });

          result.mergeIntoDataStream(dataStream);
          await result.text;
        } catch (streamError) {
          console.error("Stream error:", streamError);
          throw streamError;
        }
      },
    });
  } catch (error) {
    console.error("AI API Error:", error);
    throw new Error(
      `Failed to generate AI response: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
