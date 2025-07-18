import { tools, getAllTools } from "./index";
import { toolConfigs, getEnabledTools } from "./tool-config";

/**
 * Tool registry that manages all available tools and their configurations
 */
export class ToolRegistry {
  private static instance: ToolRegistry;

  private constructor() {}

  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  /**
   * Get all available tools for the AI SDK (including dynamic MCP tools)
   */
  async getTools() {
    const enabledToolNames = getEnabledTools();
    const enabledTools: Record<string, any> = {};

    // Get static tools first
    for (const toolName of enabledToolNames) {
      if (tools[toolName]) {
        enabledTools[toolName] = tools[toolName];
      }
    }

    // Get dynamic MCP tools
    try {
      const allTools = await getAllTools();
      
      // Add all MCP tools (they're auto-enabled if servers are running)
      for (const [toolName, tool] of Object.entries(allTools)) {
        if (toolName.startsWith('mcp_')) {
          enabledTools[toolName] = tool;
        }
      }
    } catch (error) {
      console.error('Failed to load MCP tools:', error);
    }

    return enabledTools;
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string) {
    return Object.values(toolConfigs)
      .filter((config) => config.category === category && config.enabled)
      .map((config) => tools[config.name])
      .filter(Boolean);
  }

  /**
   * Check if a tool is enabled
   */
  isToolEnabled(toolName: string): boolean {
    const config = toolConfigs[toolName as keyof typeof toolConfigs];
    return config ? config.enabled : false;
  }

  /**
   * Enable or disable a tool
   */
  setToolEnabled(toolName: string, enabled: boolean): void {
    const config = toolConfigs[toolName as keyof typeof toolConfigs];
    if (config) {
      config.enabled = enabled;
    }
  }
}

// Export singleton instance
export const toolRegistry = ToolRegistry.getInstance();
