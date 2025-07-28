import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, X, Loader2, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/tailwind';
import { AgentTool } from '../types';

interface GeneralToolCallHandlerProps {
  toolCallId: string;
  toolName: string;
  args: any;
  state: 'call' | 'result' | string;
  result?: any;
  tool?: AgentTool;
  onApprove?: (toolCallId: string) => void;
  onCancel?: (toolCallId: string) => void;
  toolsRequiringConfirmation?: string[];
}

export function GeneralToolCallHandler({ 
  toolCallId, 
  toolName, 
  args, 
  state, 
  result, 
  tool,
  onApprove, 
  onCancel,
  toolsRequiringConfirmation = []
}: GeneralToolCallHandlerProps) {
  const requiresConfirmation = toolsRequiringConfirmation.includes(toolName);
  
  // State for expanded tool details
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
  }, [state, requiresConfirmation, toolCallId, onApprove]);

  // Reset ref if toolCallId changes
  React.useEffect(() => {
    approveCalledRef.current = null;
  }, [toolCallId]);

  // Get tool label from tool definition or fallback to toolName
  const getToolLabel = () => {
    if (tool) {
      return tool.description || tool.name;
    }
    return toolName;
  };

  const getToolIcon = () => {
    return <Play className="h-3 w-3" />;
  };

  const getDangerLevelColor = () => {
    if (tool?.requiresConfirmation) {
      return 'text-red-600';
    }
    return 'text-amber-600';
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
            <div className="p-2 bg-muted/30 rounded text-xs">
              <div className="font-medium mb-1">Arguments:</div>
              <pre className="text-xs text-muted-foreground">
                {JSON.stringify(args, null, 2)}
              </pre>
              {result && (
                <>
                  <div className="font-medium mb-1 mt-2">Result:</div>
                  <pre className="text-xs text-muted-foreground">
                    {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                  </pre>
                </>
              )}
            </div>
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
          {tool?.requiresConfirmation && (
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