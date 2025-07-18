import { tool } from "ai";
import { z } from "zod";
// MCP tools are now accessed via IPC through window.mcpApi

// Dynamic MCP tool creation
export async function getMCPTools() {
  console.log('[MCP] getMCPTools called in renderer process')
  const mcpTools = await window.mcpApi.getAllTools();
  console.log('[MCP] Received', mcpTools.length, 'MCP tools from main process')
  const tools: Record<string, any> = {};

  for (const mcpTool of mcpTools) {
    const toolKey = `mcp_${mcpTool.serverId}_${mcpTool.name}`;
    
    // Convert MCP tool schema to Zod schema
    const zodSchema = convertMCPSchemaToZod(mcpTool.inputSchema);
    
    tools[toolKey] = tool({
      description: `[MCP:${mcpTool.serverId}] ${mcpTool.description}`,
      parameters: zodSchema,
      execute: async (args) => {
        console.log(`Executing MCP tool: ${mcpTool.name} on server: ${mcpTool.serverId}`);
        console.log('Arguments:', args);
        
        try {
          const result = await window.mcpApi.callTool(mcpTool.serverId, mcpTool.name, args);
          console.log('MCP tool result:', result);
          
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
          console.error(`MCP tool execution failed:`, error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            content: `Error executing ${mcpTool.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }
    });
  }

  return tools;
}

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

// Get all available MCP servers and their status
export async function getMCPServerStatus() {
  const servers = await window.mcpApi.listServers();
  return servers.map(server => ({
    id: server.id,
    name: server.config.name,
    status: server.status,
    toolCount: server.tools.length,
    lastError: server.lastError,
    uptime: server.startedAt ? Date.now() - server.startedAt.getTime() : 0
  }));
}

// Tool to list available MCP tools
export const listMCPTools = tool({
  description: "List all available MCP tools from connected servers",
  parameters: z.object({
    serverId: z.string().optional().describe("Filter tools by specific server ID")
  }),
  execute: async ({ serverId }) => {
    try {
      const allTools = await window.mcpApi.getAllTools();
      
      let filteredTools = allTools;
      if (serverId) {
        filteredTools = allTools.filter(tool => tool.serverId === serverId);
      }
      
      const toolsByServer = filteredTools.reduce((acc, tool) => {
        if (!acc[tool.serverId]) {
          acc[tool.serverId] = [];
        }
        acc[tool.serverId].push({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        });
        return acc;
      }, {} as Record<string, any[]>);
      
      const result = {
        success: true,
        content: `Available MCP Tools:\n\n${Object.entries(toolsByServer).map(([server, tools]) => 
          `**${server}:**\n${tools.map(tool => 
            `  • ${tool.name}: ${tool.description}`
          ).join('\n')}`
        ).join('\n\n')}`,
        toolsByServer,
        totalTools: filteredTools.length
      };
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        content: `Error listing MCP tools: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
});

// Tool to check MCP server status
export const mcpServerStatus = tool({
  description: "Check the status of MCP servers",
  parameters: z.object({}),
  execute: async () => {
    try {
      const status = await getMCPServerStatus();
      
      const content = `MCP Server Status:\n\n${status.map(server => 
        `**${server.name}** (${server.id}):\n` +
        `  Status: ${server.status}\n` +
        `  Tools: ${server.toolCount}\n` +
        `  Uptime: ${server.uptime > 0 ? `${Math.floor(server.uptime / 1000)}s` : 'N/A'}\n` +
        `  ${server.lastError ? `Error: ${server.lastError}` : ''}`
      ).join('\n\n')}`;
      
      return {
        success: true,
        content,
        servers: status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        content: `Error checking MCP server status: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
});

export const mcpTools = {
  listMCPTools,
  mcpServerStatus
};