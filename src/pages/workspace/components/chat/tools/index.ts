import { tool } from 'ai';
import { z } from 'zod';

export const readFile = tool({
  description: 'Read the contents of a file from the filesystem',
  parameters: z.object({
    filePath: z.string().describe('The path to the file to read'),
  }),
//   execute: async ({ filePath }) => {
//     // This will be executed on the frontend
//     const result = await window.projectApi.openFile(filePath);
//     return result.content;
//   },
});

export const tools = {
  readFile,
};

export type ToolName = keyof typeof tools;
