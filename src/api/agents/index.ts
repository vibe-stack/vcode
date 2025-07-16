import { createXai } from '@ai-sdk/xai';
import { CoreMessage, streamText, createDataStreamResponse } from 'ai';
import { settingsManager } from '../../helpers/ipc/settings/settings-listeners';
import { systemPrompt } from '../ai/system-prompt';
import { agentTools, setCurrentSessionId } from './tools';
import { agentDB } from './database';

export async function agentApi({ 
  messages, 
  sessionId 
}: { 
  messages: CoreMessage[]; 
  sessionId?: string; 
}) {
    console.log("hit the api route", messages, "session:", sessionId);

    try {
        // Get XAI API key from secure settings
        const xaiApiKey = await settingsManager.getSecure('apiKeys.xai');
        if (!xaiApiKey) {
            throw new Error('XAI API key not found. Please configure your API key in Settings > AI & Agents.');
        }

        // Set current session for tools
        if (sessionId) {
            setCurrentSessionId(sessionId);
        }

        const model = createXai({
            apiKey: xaiApiKey,
        });

        let currentStepIndex = 0;

        const result = streamText({
            model: model("grok-4-0709"),
            system: systemPrompt,
            messages,
            tools: agentTools,
            maxSteps: 50,
            // maxTokens: 10000,
            onStepFinish: async ({ toolResults, toolCalls, finishReason, isContinued, stepType, text }) => {
                // Store message and tool calls/results if we have a session
                if (sessionId) {
                    // Store assistant message
                    if (text) {
                        agentDB.addMessage({
                            sessionId,
                            role: 'assistant',
                            content: text,
                            stepIndex: currentStepIndex,
                            ...(toolCalls ? { toolCalls: JSON.stringify(toolCalls) } : {}),
                        });
                    }

                    // Store tool results
                    if (toolResults && toolResults.length > 0) {
                        // Create formatted content with tool names
                        const formattedContent = toolResults.map((result, index) => {
                            const toolCall = toolCalls?.[index];
                            const toolName = toolCall?.toolName || 'unknown_tool';
                            const resultContent = typeof result.result === 'string' 
                                ? result.result 
                                : JSON.stringify(result.result, null, 2);
                            return `**${toolName}**:\n${resultContent}`;
                        }).join('\n\n');

                        agentDB.addMessage({
                            sessionId,
                            role: 'tool',
                            content: formattedContent,
                            stepIndex: currentStepIndex,
                            toolResults: JSON.stringify(toolResults),
                        });
                    }

                    // Update progress
                    if (finishReason) {
                        agentDB.addProgress({
                            sessionId,
                            step: `Step ${currentStepIndex} completed`,
                            status: finishReason === 'stop' ? 'completed' : 'failed',
                            details: finishReason,
                        });
                    }

                    currentStepIndex++;
                }
            },
            async onFinish({ response, finishReason, usage }) {
                // Store final completion status if we have a session
                if (sessionId) {
                    agentDB.addProgress({
                        sessionId,
                        step: 'Agent execution completed',
                        status: finishReason === 'stop' ? 'completed' : 'failed',
                        details: `Reason: ${finishReason}, Usage: ${JSON.stringify(usage)}`,
                    });

                    // Update agent status to 'review' when execution completes successfully
                    if (finishReason === 'stop') {
                        console.log(`🎯 Agent execution completed successfully, moving to review status: ${sessionId}`);
                        agentDB.updateSessionStatus(sessionId, 'review', { 
                            completedAt: new Date().toISOString() 
                        });
                    } else {
                        console.log(`❌ Agent execution failed, moving to need_clarification status: ${sessionId}`);
                        agentDB.updateSessionStatus(sessionId, 'need_clarification');
                    }
                }
            },
        });

        // consume the stream to ensure it runs to completion & triggers onFinish
        // even when the client response is aborted:
        result.consumeStream(); // no await

        return result.toDataStreamResponse();
    } catch (error) {
        console.error('AI API Error:', error);
        
        // Log error to session if available
        if (sessionId) {
            agentDB.addProgress({
                sessionId,
                step: 'Agent execution failed',
                status: 'failed',
                details: error instanceof Error ? error.message : 'Unknown error',
            });
        }
        
        throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Export additional modules for external use
export { agentDB } from './database';
export { fileSnapshotManager } from './file-snapshot-manager';
export type { FileSnapshot } from './database';