import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Play } from 'lucide-react';
import { cn } from '@/utils/tailwind';

interface MapToolCallDisplayProps {
  toolCallId: string;
  toolName: string;
  args: any;
  state: 'partial-call' | 'call' | 'result';
  result?: any;
  onApprove?: (toolCallId: string) => void;
  onCancel?: (toolCallId: string) => void;
}

export function MapToolCallDisplay({
  toolCallId,
  toolName,
  args,
  state,
  result,
  onApprove,
  onCancel
}: MapToolCallDisplayProps) {
  const formatArgs = (args: any) => {
    if (!args) return '';
    
    const formattedArgs = Object.entries(args)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: [${value.join(', ')}]`;
        }
        return `${key}: ${value}`;
      })
      .join(', ');
    
    return formattedArgs;
  };

  const getToolDisplayName = (toolName: string) => {
    switch (toolName) {
      case 'addCube': return 'Add Cube';
      case 'addSphere': return 'Add Sphere';
      case 'addCylinder': return 'Add Cylinder';
      case 'removeObject': return 'Remove Object';
      case 'getObjects': return 'Get Objects';
      case 'getObject': return 'Get Object';
      case 'getFullScene': return 'Get Full Scene';
      default: return toolName;
    }
  };

  return (
    <div className={cn(
      "border rounded-lg p-3 my-2",
      state === 'result' ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Play className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-sm">{getToolDisplayName(toolName)}</span>
            {state === 'call' && (
              <span className="text-xs text-muted-foreground">• Pending approval</span>
            )}
            {state === 'result' && (
              <span className="text-xs text-green-600">• Executed</span>
            )}
          </div>
          
          {args && Object.keys(args).length > 0 && (
            <div className="text-xs text-muted-foreground mb-2">
              {formatArgs(args)}
            </div>
          )}
          
          {state === 'result' && result && (
            <div className="text-xs bg-white p-2 rounded border">
              <pre className="whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </div>
        
        {state === 'call' && onApprove && onCancel && (
          <div className="flex gap-1 ml-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCancel(toolCallId)}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              title="Cancel"
            >
              <X className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onApprove(toolCallId)}
              className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
              title="Execute"
            >
              <Check className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
