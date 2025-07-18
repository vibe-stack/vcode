import { tool } from "ai";
import { z } from "zod";
import { getMCPManager } from "../../../helpers/ipc/mcp/mcp-listeners";

// Basic file system tools for the main process
const readFile = tool({
  description: "Read the contents of a file from the filesystem",
  parameters: z.object({
    filePath: z.string().describe("The path to the file to read"),
  }),
  // No execute function - requires frontend confirmation
});

const writeFile = tool({
  description: "Write content to a file in the filesystem",
  parameters: z.object({
    filePath: z.string().describe("The path to the file to write"),
    content: z.string().describe("The content to write to the file"),
  }),
  // No execute function - requires frontend confirmation
});

const listDirectory = tool({
  description: "List the contents of a directory",
  parameters: z.object({
    dirPath: z.string().describe("The path to the directory to list"),
  }),
  // No execute function - requires frontend confirmation
});

const createDirectory = tool({
  description: "Create a new directory",
  parameters: z.object({
    dirPath: z.string().describe("The path to the directory to create"),
  }),
  // No execute function - requires frontend confirmation
});

const deleteFile = tool({
  description: "Delete a file from the filesystem",
  parameters: z.object({
    filePath: z.string().describe("The path to the file to delete"),
  }),
  // No execute function - requires frontend confirmation
});

const searchFiles = tool({
  description: "Search for files by name or content",
  parameters: z.object({
    query: z.string().describe("The search query to find files"),
    directory: z.string().optional().describe("The directory to search in (optional)"),
  }),
  // No execute function - requires frontend confirmation
});

const getProjectInfo = tool({
  description: "Get information about the current project",
  parameters: z.object({
    includeStats: z.boolean().optional().describe("Whether to include file statistics"),
  }),
  // No execute function - requires frontend confirmation
});

// Convert MCP JSON Schema to Zod schema
function convertMCPSchemaToZod(schema: any): z.ZodType<any> {
  if (!schema || !schema.properties) {
    return z.object({});
  }

  const zodObj: Record<string, z.ZodType<any>> = {};

  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    const prop = propSchema as any;
    let zodType: z.ZodType<any>;

    switch (prop.type) {
      case 'string':
        zodType = z.string();
        if (prop.description) {
          zodType = zodType.describe(prop.description);
        }
        break;
      
      case 'number':
        zodType = z.number();
        if (prop.description) {
          zodType = zodType.describe(prop.description);
        }
        break;
      
      case 'integer':
        zodType = z.number().int();
        if (prop.description) {
          zodType = zodType.describe(prop.description);
        }
        break;
      
      case 'boolean':
        zodType = z.boolean();
        if (prop.description) {
          zodType = zodType.describe(prop.description);
        }
        break;
      
      case 'array':
        if (prop.items) {
          const itemType = convertMCPSchemaToZod({ properties: { item: prop.items } });
          zodType = z.array(itemType);
        } else {
          zodType = z.array(z.any());
        }
        if (prop.description) {
          zodType = zodType.describe(prop.description);
        }
        break;
      
      case 'object':
        if (prop.properties) {
          zodType = convertMCPSchemaToZod(prop);
        } else {
          zodType = z.record(z.any());
        }
        if (prop.description) {
          zodType = zodType.describe(prop.description);
        }
        break;
      
      default:
        zodType = z.any();
        if (prop.description) {
          zodType = zodType.describe(prop.description);
        }
    }

    // Handle required fields
    if (!schema.required || !schema.required.includes(propName)) {
      zodType = zodType.optional();
    }

    zodObj[propName] = zodType;
  }

  return z.object(zodObj);
}

// Get all tools including MCP tools from the main process
export async function getAllTools() {
  console.log('[AI Tools] 🔧 Loading all tools including MCP...')
  
  const staticTools = {
    readFile,
    writeFile,
    listDirectory,
    createDirectory,
    deleteFile,
    searchFiles,
    getProjectInfo,
  };

  // Get MCP tools from the main process manager
  const mcpManager = getMCPManager();
  if (!mcpManager) {
    console.error('[AI Tools] ❌ No MCP manager available, returning static tools only')
    return staticTools;
  }

  console.log('[AI Tools] 🔧 MCP Manager found, getting tools...')
  const mcpTools = mcpManager.getAllTools();
  console.log('[AI Tools] 📊 Found', mcpTools.length, 'MCP tools')
  
  if (mcpTools.length === 0) {
    console.error('[AI Tools] ❌ No MCP tools found! Checking server status...')
    const serverInstances = mcpManager.getServerInstances();
    console.log('[AI Tools] 🖥️ Server instances:', serverInstances.map(s => ({ id: s.id, status: s.status, toolCount: s.tools.length })))
  }

  const dynamicMCPTools: Record<string, any> = {};

  for (const mcpTool of mcpTools) {
    const toolKey = `mcp_${mcpTool.serverId}_${mcpTool.name}`;
    
    // Convert MCP tool schema to Zod schema
    const zodSchema = convertMCPSchemaToZod(mcpTool.inputSchema);
    
    dynamicMCPTools[toolKey] = tool({
      description: `[MCP:${mcpTool.serverId}] ${mcpTool.description}`,
      parameters: zodSchema,
      execute: async (args) => {
        console.log(`[AI Tools] Executing MCP tool: ${mcpTool.name} on server: ${mcpTool.serverId}`);
        console.log('[AI Tools] Arguments:', args);
        
        try {
          const result = await mcpManager.callTool(mcpTool.serverId, mcpTool.name, args);
          console.log('[AI Tools] MCP tool result:', result);
          
          // Format the result for display
          if (result.content) {
            if (Array.isArray(result.content)) {
              return {
                success: true,
                content: result.content.map((item: any) => {
                  if (item.type === 'text') {
                    return item.text;
                  } else if (item.type === 'image') {
                    return `[Image: ${item.data}]`;
                  } else if (item.type === 'resource') {
                    return `[Resource: ${item.resource?.uri}]`;
                  }
                  return JSON.stringify(item);
                }).join('\n'),
                raw: result
              };
            } else {
              return {
                success: true,
                content: result.content,
                raw: result
              };
            }
          }
          
          return {
            success: true,
            content: JSON.stringify(result, null, 2),
            raw: result
          };
        } catch (error) {
          console.error(`[AI Tools] MCP tool execution failed:`, error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            content: `Error executing ${mcpTool.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }
    });
  }

  console.log('[AI Tools] 🚀 Returning', Object.keys(staticTools).length, 'static tools and', Object.keys(dynamicMCPTools).length, 'MCP tools')

  return {
    ...staticTools,
    ...dynamicMCPTools
  };
}