import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Wrench,
  Zap,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/utils/tailwind';

interface Tool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'file' | 'mcp' | 'system';
  status?: 'running' | 'stopped' | 'starting' | 'error';
  serverId?: string;
}

interface ToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onToolToggle: (toolId: string, enabled: boolean) => void;
  onRefreshMCP: () => void;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  isOpen,
  onClose,
  onToolToggle,
  onRefreshMCP
}) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [mcpServers, setMcpServers] = useState<Array<{
    id: string;
    status: string;
    toolCount: number;
  }>>([]);
  const [loading, setLoading] = useState(false);

  const loadTools = async () => {
    setLoading(true);
    try {
      // Get MCP servers status
      const servers = await window.mcpApi?.listServers() || [];
      setMcpServers(servers);

      // Get MCP tools
      const mcpTools = await window.mcpApi?.getAllTools() || [];
      
      // Static file system tools
      const staticTools: Tool[] = [
        {
          id: 'readFile',
          name: 'Read File',
          description: 'Read the contents of a file from the filesystem',
          enabled: true,
          category: 'file'
        },
        {
          id: 'writeFile', 
          name: 'Write File',
          description: 'Write content to a file in the filesystem',
          enabled: true,
          category: 'file'
        },
        {
          id: 'listDirectory',
          name: 'List Directory',
          description: 'List the contents of a directory',
          enabled: true,
          category: 'file'
        },
        {
          id: 'createDirectory',
          name: 'Create Directory', 
          description: 'Create a new directory',
          enabled: true,
          category: 'file'
        },
        {
          id: 'deleteFile',
          name: 'Delete File',
          description: 'Delete a file from the filesystem',
          enabled: true,
          category: 'file'
        },
        {
          id: 'searchFiles',
          name: 'Search Files',
          description: 'Search for files by name or content',
          enabled: true,
          category: 'file'
        },
        {
          id: 'getProjectInfo',
          name: 'Get Project Info',
          description: 'Get information about the current project',
          enabled: true,
          category: 'system'
        }
      ];

      // Convert MCP tools
      const mcpToolItems: Tool[] = mcpTools.map((tool: any) => ({
        id: `mcp_${tool.serverId}_${tool.name}`,
        name: tool.name,
        description: tool.description || 'MCP tool',
        enabled: true,
        category: 'mcp' as const,
        serverId: tool.serverId,
        status: servers.find(s => s.id === tool.serverId)?.status || 'stopped'
      }));

      setTools([...staticTools, ...mcpToolItems]);
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTools();
    }
  }, [isOpen]);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'starting':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'stopped':
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mcp':
        return <Zap className="h-4 w-4 text-purple-500" />;
      case 'system':
        return <Settings className="h-4 w-4 text-blue-500" />;
      case 'file':
      default:
        return <Wrench className="h-4 w-4 text-gray-500" />;
    }
  };

  const groupedTools = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h2 className="text-lg font-semibold">AI Tools Manager</h2>
            <Badge variant="outline" className="ml-2">
              {tools.length} tools
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onRefreshMCP();
                loadTools();
              }}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* MCP Servers Status */}
        {mcpServers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-500" />
              MCP Servers
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {mcpServers.map((server) => (
                <div
                  key={server.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(server.status)}
                    <div>
                      <div className="text-sm font-medium">{server.id}</div>
                      <div className="text-xs text-gray-400">
                        {server.toolCount} tools
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={server.status === 'running' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {server.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tools by Category */}
        <div className="space-y-6">
          {Object.entries(groupedTools).map(([category, categoryTools]) => (
            <div key={category}>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                {getCategoryIcon(category)}
                {category.charAt(0).toUpperCase() + category.slice(1)} Tools
                <Badge variant="outline" className="text-xs">
                  {categoryTools.length}
                </Badge>
              </h3>
              <div className="space-y-2">
                {categoryTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        {tool.category === 'mcp' && getStatusIcon(tool.status)}
                        {getCategoryIcon(tool.category)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{tool.name}</div>
                        <div className="text-xs text-gray-400 line-clamp-2">
                          {tool.description}
                        </div>
                        {tool.serverId && (
                          <div className="text-xs text-purple-400 mt-1">
                            Server: {tool.serverId}
                          </div>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={tool.enabled}
                      onCheckedChange={(checked) => onToolToggle(tool.id, checked)}
                      disabled={tool.category === 'mcp' && tool.status !== 'running'}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {tools.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No tools found</p>
            <p className="text-xs">Try refreshing or check your MCP configuration</p>
          </div>
        )}
      </div>
    </div>
  );
};