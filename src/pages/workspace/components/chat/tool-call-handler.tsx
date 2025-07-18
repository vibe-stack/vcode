import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  X,
  Loader2,
  Check,
  AlertTriangle,
  FileText,
  Folder,
  Search,
} from "lucide-react";
import { cn } from "@/utils/tailwind";
import { toolExecutionService } from "./tools/tool-execution-service";
import { getToolConfig } from "./tools/tool-config";
import { ToolDisplay } from "./tool-displays";
import { ToolName } from "./tools";

interface ToolCallHandlerProps {
  toolCallId: string;
  toolName: string;
  args: any;
  state: "call" | "result" | string;
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
  onCancel,
}: ToolCallHandlerProps) {
  const toolsRequiringConfirmation =
    toolExecutionService.getToolsRequiringConfirmation();
  const requiresConfirmation = toolsRequiringConfirmation.includes(
    toolName as any,
  );
  const toolConfig = getToolConfig(toolName as any);

  // State for expanded tool details - use toolCallId as key for uniqueness
  const [expanded, setExpanded] = React.useState(false);

  // Ref to ensure onApprove is called only once per toolCallId
  const approveCalledRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (
      state === "call" &&
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

  // Helper to get filename from path
  const getFileName = (filePath: string): string => {
    if (!filePath) return "";
    return filePath.split("/").pop() || filePath;
  };

  // Get meaningful tool label based on tool type and args
  const getToolLabel = () => {
    switch (toolName) {
      case "readFile":
        return `Read ${getFileName(args?.filePath || "")}`;
      case "writeFile":
        return `Write ${getFileName(args?.filePath || "")}`;
      case "listDirectory":
        return `List ${getFileName(args?.dirPath || "")}`;
      case "createDirectory":
        return `Create ${getFileName(args?.dirPath || "")}`;
      case "deleteFile":
        return `Delete ${getFileName(args?.filePath || "")}`;
      case "searchFiles":
        return `Search "${args?.query || ""}"`;
      case "getProjectInfo":
        return "Get project info";
      default:
        return toolConfig?.displayName || toolName;
    }
  };

  const getToolIcon = () => {
    if (!toolConfig) return <Play className="h-3 w-3" />;
    switch (toolConfig.category) {
      case "file":
        return <FileText className="h-3 w-3" />;
      case "directory":
        return <Folder className="h-3 w-3" />;
      case "search":
        return <Search className="h-3 w-3" />;
      default:
        return <Play className="h-3 w-3" />;
    }
  };

  const getDangerLevelColor = () => {
    if (!toolConfig) return "text-amber-600";
    switch (toolConfig.dangerLevel) {
      case "safe":
        return "text-green-600";
      case "caution":
        return "text-amber-600";
      case "dangerous":
        return "text-red-600";
      default:
        return "text-amber-600";
    }
  };

  // If the tool is executing (waiting for result)
  if (state === "call" && !requiresConfirmation) {
    return (
      <div className="bg-muted/50 flex items-center gap-2 rounded px-2 py-1 text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-muted-foreground">
          Executing {getToolLabel()}...
        </span>
      </div>
    );
  }

  // If the tool has completed execution
  if (state === "result" && !requiresConfirmation) {
    return (
      <div className="space-y-2">
        <div
          className="hover:bg-muted/30 flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs opacity-70 transition-all hover:opacity-90"
          onClick={() => setExpanded(!expanded)}
        >
          <Check className="h-3 w-3 text-green-600" />
          <span className="text-green-700 dark:text-green-300">
            {getToolLabel()}
          </span>
          <span className="text-muted-foreground ml-auto text-xs">
            {expanded ? "Click to collapse" : "Click for details"}
          </span>
        </div>
        {expanded && (
          <div className="ml-6">
            <ToolDisplay
              toolName={toolName as ToolName}
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
  if (state === "call" && requiresConfirmation) {
    return (
      <div className="flex items-center gap-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs dark:border-amber-800 dark:bg-amber-950">
        <div className="flex flex-1 items-center gap-1">
          <span className={getDangerLevelColor()}>{getToolIcon()}</span>
          <span className="text-amber-700 dark:text-amber-300">
            Execute {getToolLabel()}?
          </span>
          {toolConfig?.dangerLevel === "dangerous" && (
            <AlertTriangle className="h-3 w-3 text-red-500" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            onClick={() => onApprove?.(toolCallId)}
            className="h-5 bg-green-600 px-2 text-xs hover:bg-green-700"
          >
            <Check className="mr-1 h-2 w-2" />
            Yes
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCancel?.(toolCallId)}
            className="h-5 border-red-200 px-2 text-xs text-red-600 hover:bg-red-50"
          >
            <X className="mr-1 h-2 w-2" />
            No
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
