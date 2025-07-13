import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, X, Loader2, Check } from 'lucide-react';
import { cn } from '@/utils/tailwind';
import { getToolsRequiringConfirmation } from './tools/frontend-utils';

interface ToolCallHandlerProps {
  toolCallId: string;
  toolName: string;
  args: any;
  state: 'call' | 'result' | string;
  result?: any;
  onApprove?: (toolCallId: string) => void;
  onCancel?: (toolCallId: string) => void;
}

export function ToolCallHandler({ 
  toolCallId, 
  toolName, 
  args, 
  state, 
  result, 
  onApprove, 
  onCancel 
}: ToolCallHandlerProps) {
  const toolsRequiringConfirmation = getToolsRequiringConfirmation();
  const requiresConfirmation = toolsRequiringConfirmation.includes(toolName as any);
  
  // If the tool is executing (waiting for result)
  if (state === 'call' && !requiresConfirmation) {
    return (
      <div className="flex items-center gap-2 py-1 px-2 rounded bg-muted/50 text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-muted-foreground">Executing {toolName}...</span>
      </div>
    );
  }

  // If the tool has completed execution
  if (state === 'result' && !requiresConfirmation) {
    return (
      <div className="flex items-center gap-2 py-1 px-2 rounded opacity-60 text-xs">
        <Check className="h-3 w-3 text-green-600" />
        <span className="text-green-700 dark:text-green-300">Executed {toolName}</span>
      </div>
    );
  }

  // If the tool requires confirmation and is waiting for approval
  if (state === 'call' && requiresConfirmation) {
    return (
      <div className="flex items-center gap-2 p-2 rounded bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-xs">
        <div className="flex items-center gap-1 flex-1">
          <Play className="h-3 w-3 text-amber-600" />
          <span className="text-amber-700 dark:text-amber-300">Execute {toolName}?</span>
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
