/**
 * Example: How to add a new tool
 * 
 * This file demonstrates how to add a simple "getCurrentTime" tool
 * Follow these steps to add any new tool to the system.
 */

// Step 1: Add to tools/index.ts
/*
import { z } from 'zod';
import { tool } from 'ai';

const getCurrentTimeParams = z.object({
  format: z.enum(['12h', '24h']).optional().describe('Time format (12h or 24h)'),
  timezone: z.string().optional().describe('Timezone (e.g., UTC, EST, PST)'),
});

export const getCurrentTime = tool({
  description: 'Get the current time and date',
  parameters: getCurrentTimeParams,
  // No execute function - requires frontend confirmation
});

// Add to tools object:
export const tools = {
  // ...existing tools...
  getCurrentTime,
};
*/

// Step 2: Add to tools/executors.ts
/*
async getCurrentTime(args: { format?: '12h' | '24h'; timezone?: string }): Promise<string> {
  try {
    const now = new Date();
    const format = args.format || '24h';
    const timezone = args.timezone || 'local';
    
    let timeString: string;
    
    if (format === '12h') {
      timeString = now.toLocaleTimeString('en-US', { 
        hour12: true,
        timeZone: timezone === 'local' ? undefined : timezone
      });
    } else {
      timeString = now.toLocaleTimeString('en-US', { 
        hour12: false,
        timeZone: timezone === 'local' ? undefined : timezone
      });
    }
    
    const dateString = now.toLocaleDateString('en-US', {
      timeZone: timezone === 'local' ? undefined : timezone
    });
    
    return `Current time: ${timeString} on ${dateString}${timezone !== 'local' ? ` (${timezone})` : ''}`;
  } catch (error) {
    console.error('[getCurrentTime tool] Error:', error);
    throw new Error(`Failed to get current time: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
},
*/

// Step 3: Add to tools/tool-config.ts
/*
export const toolConfigs: Record<ToolName, ToolConfig> = {
  // ...existing configs...
  getCurrentTime: {
    name: 'getCurrentTime',
    displayName: 'Get Current Time',
    description: 'Get the current time and date',
    category: 'project', // or create a new 'utility' category
    requiresConfirmation: false, // This is a safe operation
    dangerLevel: 'safe',
    enabled: true,
  },
};
*/

// That's it! The tool is now available in the chat interface and will be automatically
// included in the AI model's available tools.

// Usage example in chat:
// "What time is it?"
// "Get me the current time in 12-hour format"
// "What's the current time in UTC?"

export {}; // Make this file a module
