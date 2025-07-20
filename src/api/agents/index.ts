import { createXai } from '@ai-sdk/xai';
import { CoreMessage, streamText, createDataStreamResponse } from 'ai';
import { settingsManager } from '../../helpers/ipc/settings/settings-listeners';
import { systemPrompt } from '../ai/system-prompt';
import { agentTools, setCurrentSessionId } from './tools';
import { agentDB } from './database';
import { agentManager } from './manager';

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

                    // Store tool calls if they exist
                    if (toolCalls && toolCalls.length > 0) {
                        toolCalls.forEach((toolCall, index) => {
                            // Store each tool call as a separate message to preserve all details
                            agentDB.addMessage({
                                sessionId,
                                role: 'tool',
                                content: JSON.stringify({
                                    type: 'tool_call',
                                    toolCallId: toolCall.toolCallId,
                                    toolName: toolCall.toolName,
                                    args: toolCall.args,
                                    state: 'call'
                                }, null, 2),
                                stepIndex: currentStepIndex,
                                toolCalls: JSON.stringify([toolCall]),
                            });
                        });
                    }

                    // Update tool calls with results if they exist
                    if (toolResults && toolResults.length > 0) {
                        toolResults.forEach((result, index) => {
                            const toolCall = toolCalls?.[index];
                            
                            if (toolCall?.toolCallId) {
                                // Find the existing tool call message and update it with the result
                                const existingMessage = agentDB.findMessageByToolCallId(sessionId, toolCall.toolCallId, currentStepIndex);
                                
                                if (existingMessage) {
                                    // Update the existing message with the result
                                    const updatedContent = JSON.stringify({
                                        type: 'tool_call_with_result',
                                        toolCallId: toolCall.toolCallId,
                                        toolName: toolCall.toolName,
                                        args: toolCall.args,
                                        state: 'completed',
                                        result: result.result
                                    }, null, 2);
                                    
                                    agentDB.updateMessage(existingMessage.id, {
                                        content: updatedContent,
                                        toolResults: JSON.stringify([result])
                                    });
                                } else {
                                    // Fallback: create new message if not found (shouldn't happen normally)
                                    agentDB.addMessage({
                                        sessionId,
                                        role: 'tool',
                                        content: JSON.stringify({
                                            type: 'tool_result', 
                                            toolCallId: toolCall.toolCallId,
                                            toolName: toolCall.toolName,
                                            args: toolCall.args,
                                            state: 'result',
                                            result: result.result
                                        }, null, 2),
                                        stepIndex: currentStepIndex,
                                        toolResults: JSON.stringify([result]),
                                    });
                                }
                            }
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
                    // Only handle error cases here - successful completion should be handled by finishWork() tool
                    if (finishReason !== 'stop') {
                        console.log(`❌ Agent execution failed with reason: ${finishReason}, moving to need_clarification status: ${sessionId}`);
                        await agentManager.updateAgentStatus(sessionId, 'need_clarification', {
                            metadata: JSON.stringify({
                                error: `Execution failed: ${finishReason}`,
                                failedAt: new Date().toISOString()
                            })
                        });
                        
                        agentDB.addProgress({
                            sessionId,
                            step: 'Agent execution failed',
                            status: 'failed',
                            details: `Reason: ${finishReason}, Usage: ${JSON.stringify(usage)}`,
                        });
                    } else {
                        // Successful completion - but don't change status here
                        // The LLM should call finishWork() to move to 'review' status
                        console.log(`✅ Agent stream completed successfully: ${sessionId}, waiting for finishWork() call`);
                        
                        agentDB.addProgress({
                            sessionId,
                            step: 'Agent stream completed',
                            status: 'completed',
                            details: `Usage: ${JSON.stringify(usage)}`,
                        });
                    }
                }
            },
        });

        // consume the stream to ensure it runs to completion & triggers onFinish
        // even when the client response is aborted:
        result.consumeStream(); // no await

        return result.toDataStreamResponse({
            sendReasoning: true, // Enable reasoning tokens to be sent to client
        });
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