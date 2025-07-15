import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Folder, Search, Settings, AlertTriangle, CheckCircle } from 'lucide-react';
import { toolConfigs, ToolConfig } from './tool-config';
import { toolRegistry } from './tool-registry';

interface ToolManagerProps {
  onClose?: () => void;
}

export function ToolManager({ onClose }: ToolManagerProps) {
  const [configs, setConfigs] = useState(toolConfigs);
  
  const getCategoryIcon = (category: ToolConfig['category']) => {
    switch (category) {
      case 'file':
        return <FileText className="h-4 w-4" />;
      case 'directory':
        return <Folder className="h-4 w-4" />;
      case 'search':
        return <Search className="h-4 w-4" />;
      case 'project':
        return <Settings className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };
  
  const getDangerLevelColor = (level: ToolConfig['dangerLevel']) => {
    switch (level) {
      case 'safe':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'caution':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'dangerous':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };
  
  const getDangerIcon = (level: ToolConfig['dangerLevel']) => {
    switch (level) {
      case 'dangerous':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return null;
    }
  };
  
  const handleToggleTool = (toolName: string) => {
    setConfigs(prev => ({
      ...prev,
      [toolName]: {
        ...prev[toolName as keyof typeof prev],
        enabled: !prev[toolName as keyof typeof prev].enabled
      }
    }));
    
    // Update the registry
    toolRegistry.setToolEnabled(toolName, !toolRegistry.isToolEnabled(toolName));
  };
  
  const groupedTools = Object.values(configs).reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, ToolConfig[]>);
  
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tool Manager</h2>
          <p className="text-muted-foreground">Configure which tools are available to Grok</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
      
      {Object.entries(groupedTools).map(([category, tools]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 capitalize">
              {getCategoryIcon(category as ToolConfig['category'])}
              {category} Tools
            </CardTitle>
            <CardDescription>
              {category === 'file' && 'Tools for reading, writing, and managing files'}
              {category === 'directory' && 'Tools for managing directories and folder structures'}
              {category === 'search' && 'Tools for searching and finding content'}
              {category === 'project' && 'Tools for project-level operations and information'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tools.map((tool) => (
                <div key={tool.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{tool.displayName}</h4>
                      <Badge className={getDangerLevelColor(tool.dangerLevel)}>
                        {getDangerIcon(tool.dangerLevel)}
                        {tool.dangerLevel}
                      </Badge>
                      {tool.requiresConfirmation && (
                        <Badge variant="outline" className="text-xs">
                          Requires Approval
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                  <Switch
                    checked={tool.enabled}
                    onCheckedChange={() => handleToggleTool(tool.name)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Card>
        <CardHeader>
          <CardTitle>Tool Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(configs).filter(c => c.enabled).length}
              </div>
              <div className="text-sm text-muted-foreground">Enabled Tools</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {Object.values(configs).filter(c => !c.enabled).length}
              </div>
              <div className="text-sm text-muted-foreground">Disabled Tools</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {Object.values(configs).filter(c => c.requiresConfirmation).length}
              </div>
              <div className="text-sm text-muted-foreground">Require Approval</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {Object.values(configs).filter(c => c.dangerLevel === 'dangerous').length}
              </div>
              <div className="text-sm text-muted-foreground">Dangerous Tools</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
