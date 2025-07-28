import { createXai } from '@ai-sdk/xai';
import { CoreMessage, streamText, createDataStreamResponse } from 'ai';
import { mapBuilderToolDefinitions } from '../../pages/apps/map-builder/components/chat/map-builder-tools';
import { settingsManager } from '../../helpers/ipc/settings/settings-listeners';
import { systemPrompt as mapBuilderSystemPrompt } from './system-prompt';

// Type for the enhanced request body
interface EnhancedRequestBody {
  messages: CoreMessage[];
  agentType?: string;
  systemPrompt?: string;
  maxSteps?: number;
}

interface ChatApiOptions {
  messages: CoreMessage[];
  agentType?: string;
  systemPrompt?: string;
  tools?: any;
  maxSteps?: number;
}

// Agent configurations
const agentConfigs = {
  'map-builder': {
    systemPrompt: mapBuilderSystemPrompt,
    tools: mapBuilderToolDefinitions,
    settingsKey: 'apps:map-builder:agent-model'
  },
  'mapBuilder': { // Also support camelCase variant
    systemPrompt: mapBuilderSystemPrompt,
    tools: mapBuilderToolDefinitions,
    settingsKey: 'apps:map-builder:agent-model'
  }
};

export async function chatApi({ 
  messages, 
  agentType = 'map-builder',
  systemPrompt: customSystemPrompt,
  tools: customTools,
  maxSteps = 50
}: ChatApiOptions) {
  try {
    // Get XAI API key from secure settings
    const xaiApiKey = await settingsManager.getSecure('apiKeys.xai');
    if (!xaiApiKey) {
      throw new Error('XAI API key not found. Please configure your API key in Settings > AI & Agents.');
    }

    // Get agent config or use defaults
    const agentConfig = agentConfigs[agentType as keyof typeof agentConfigs];
    const finalSystemPrompt = customSystemPrompt || agentConfig?.systemPrompt || mapBuilderSystemPrompt;
    const finalTools = customTools || agentConfig?.tools || mapBuilderToolDefinitions;
    const settingsKey = agentConfig?.settingsKey || 'apps:map-builder:agent-model';

    // Get selected model from settings, default to grok-4-0709
    const selectedModel = await settingsManager.get(settingsKey) || 'grok-4-0709';

    const model = createXai({
      apiKey: xaiApiKey,
    });
    
    return createDataStreamResponse({
      execute: async (dataStream) => {
        try {
          const result = streamText({
            model: model(selectedModel),
            system: finalSystemPrompt,
            messages: messages,
            tools: finalTools,
            maxSteps: maxSteps,
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
