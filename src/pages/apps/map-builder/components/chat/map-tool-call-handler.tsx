import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, X, Loader2, Check, AlertTriangle, Box, Circle, Trash2, Eye, Database, RectangleHorizontal } from 'lucide-react';
import { cn } from '@/utils/tailwind';
import { mapBuilderToolExecutionService } from './map-tool-execution-service';
import { MapToolDisplay } from './map-tool-display';

type MapBuilderToolName = 'addCube' | 'addSphere' | 'addCylinder' | 'addPlane' | 'addDoor' | 'removeObject' | 'getObjects' | 'getObject' | 'getFullScene';

interface MapToolCallHandlerProps {
  toolCallId: string;
  toolName: string;
  args: any;
  state: 'call' | 'result' | string;
  result?: any;
  onApprove?: (toolCallId: string) => void;
  onCancel?: (toolCallId: string) => void;
}

export function MapToolCallHandler({ 
  toolCallId, 
  toolName, 
  args, 
  state, 
  result, 
  onApprove, 
  onCancel 
}: MapToolCallHandlerProps) {
  const toolsRequiringConfirmation = mapBuilderToolExecutionService.getToolsRequiringConfirmation();
  const requiresConfirmation = toolsRequiringConfirmation.includes(toolName);
  
  // State for expanded tool details - use toolCallId as key for uniqueness
  const [expanded, setExpanded] = React.useState(false);

  // Ref to ensure onApprove is called only once per toolCallId
  const approveCalledRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (
      state === 'call' &&
      !requiresConfirmation &&
      onApprove &&
      approveCalledRef.current !== toolCallId
    ) {
      approveCalledRef.current = toolCallId;
      onApprove(toolCallId);
    }
    // Only run when state, requiresConfirmation, toolCallId, or onApprove changes
  }, [state, requiresConfirmation, toolCallId, onApprove]);

  // Reset ref if toolCallId changes (e.g., new tool call)
  React.useEffect(() => {
    approveCalledRef.current = null;
  }, [toolCallId]);

  // Get meaningful tool label based on tool type and args
  const getToolLabel = () => {
    switch (toolName) {
      case 'addCube':
        return `Add Cube`;
      case 'addSphere':
        return `Add Sphere`;
      case 'addCylinder':
        return `Add Cylinder`;
      case 'addDoor':
        return `Add Door`;
      case 'removeObject':
        return `Remove Object ${args?.id || ''}`;
      case 'getObjects':
        return 'Get All Objects';
      case 'getObject':
        return `Get Object ${args?.id || ''}`;
      case 'getFullScene':
        return 'Get Full Scene';
      default:
        return toolName;
    }
  };

  const getToolIcon = () => {
    switch (toolName) {
      case 'addCube':
        return <Box className="h-3 w-3" />;
      case 'addSphere':
        return <Circle className="h-3 w-3" />;
      case 'addCylinder':
        return <Circle className="h-3 w-3" />;
      case 'addDoor':
        return <RectangleHorizontal className="h-3 w-3" />;
      case 'removeObject':
        return <Trash2 className="h-3 w-3" />;
      case 'getObjects':
      case 'getFullScene':
        return <Database className="h-3 w-3" />;
      case 'getObject':
        return <Eye className="h-3 w-3" />;
      default:
        return <Play className="h-3 w-3" />;
    }
  };

  const getDangerLevelColor = () => {
    switch (toolName) {
      case 'removeObject':
        return 'text-red-600';
      case 'addCube':
      case 'addSphere':
      case 'addCylinder':
      case 'addDoor':
        return 'text-amber-600';
      case 'getObjects':
      case 'getObject':
      case 'getFullScene':
        return 'text-green-600';
      default:
        return 'text-amber-600';
    }
  };

  // If the tool is executing (waiting for result)
  if (state === 'call' && !requiresConfirmation) {
    return (
      <div className="flex items-center gap-2 py-1 px-2 rounded bg-muted/50 text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-muted-foreground">Executing {getToolLabel()}...</span>
      </div>
    );
  }

  // If the tool has completed execution
  if (state === 'result' && !requiresConfirmation) {
    return (
      <div className="space-y-2">
        <div 
          className="flex items-center gap-2 py-1 px-2 rounded opacity-70 text-xs cursor-pointer hover:opacity-90 hover:bg-muted/30 transition-all"
          onClick={() => setExpanded(!expanded)}
        >
          <Check className="h-3 w-3 text-green-600" />
          <span className="text-green-700 dark:text-green-300">
            {getToolLabel()}
          </span>
          <span className="text-muted-foreground text-xs ml-auto">
            {expanded ? 'Click to collapse' : 'Click for details'}
          </span>
        </div>
        {expanded && (
          <div className="ml-6">
            <MapToolDisplay
              toolName={toolName as MapBuilderToolName}
              args={args}
              result={result}
              state={state}
            />
          </div>
        )}
      </div>
    );
  }

  // If the tool requires confirmation and is waiting for approval
  if (state === 'call' && requiresConfirmation) {
    return (
      <div className="flex items-center gap-2 p-2 rounded bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-xs">
        <div className="flex items-center gap-1 flex-1">
          <span className={getDangerLevelColor()}>
            {getToolIcon()}
          </span>
          <span className="text-amber-700 dark:text-amber-300">
            Execute {getToolLabel()}?
          </span>
          {toolName === 'removeObject' && (
            <AlertTriangle className="h-3 w-3 text-red-500" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            onClick={() => onApprove?.(toolCallId)}
            className="h-5 px-2 text-xs bg-green-600 hover:bg-green-700"
          >
            <Check className="h-2 w-2 mr-1" />
            Yes
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCancel?.(toolCallId)}
            className="h-5 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
          >
            <X className="h-2 w-2 mr-1" />
            No
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
