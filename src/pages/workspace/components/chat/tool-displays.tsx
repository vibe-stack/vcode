import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolName } from "./tools";

interface ToolDisplayProps {
  toolName: ToolName;
  args: any;
  result?: any;
  state: "call" | "result" | string;
}

// Helper to extract filename from path
const getFileName = (filePath: string): string => {
  if (!filePath) return "";
  return filePath.split("/").pop() || filePath;
};

// Helper to format args for display
const formatArgs = (args: any): string => {
  if (!args || typeof args !== "object") return "";
  return JSON.stringify(args, null, 2);
};

// Helper to format result for display
const formatResult = (result: any): string => {
  if (!result) return "";
  if (typeof result === "string") return result;
  return JSON.stringify(result, null, 2);
};

export function ToolDisplay({
  toolName,
  args,
  result,
  state,
}: ToolDisplayProps) {
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
        return toolName;
    }
  };

  const getToolDetails = () => {
    switch (toolName) {
      case "readFile":
        return {
          summary: `Reading file: ${args?.filePath || ""}`,
          details: { filePath: args?.filePath },
        };
      case "writeFile":
        return {
          summary: `Writing to: ${args?.filePath || ""}`,
          details: {
            filePath: args?.filePath,
            contentLength: args?.content?.length || 0,
          },
        };
      case "listDirectory":
        return {
          summary: `Listing directory: ${args?.dirPath || ""}`,
          details: { dirPath: args?.dirPath },
        };
      case "createDirectory":
        return {
          summary: `Creating directory: ${args?.dirPath || ""}`,
          details: { dirPath: args?.dirPath },
        };
      case "deleteFile":
        return {
          summary: `Deleting file: ${args?.filePath || ""}`,
          details: { filePath: args?.filePath },
        };
      case "searchFiles":
        return {
          summary: `Searching for: ${args?.query || ""}`,
          details: { query: args?.query, directory: args?.directory },
        };
      case "getProjectInfo":
        return {
          summary: "Getting project information",
          details: { includeStats: args?.includeStats },
        };
      default:
        return {
          summary: toolName,
          details: args,
        };
    }
  };

  const toolDetails = getToolDetails();

  return (
    <div className="space-y-2">
      <Card className="border-muted text-xs">
        <CardHeader className="pt-3 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            {toolName}
            <Badge variant="secondary" className="text-xs">
              {state}
            </Badge>
          </CardTitle>
          <p className="text-muted-foreground text-xs">{toolDetails.summary}</p>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-medium">
              Arguments:
            </p>
            <pre className="bg-muted/50 overflow-x-auto rounded border p-2 text-xs">
              {formatArgs(args)}
            </pre>
          </div>

          {result && (
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium">
                Result:
              </p>
              <pre className="bg-muted/50 max-h-40 overflow-x-auto overflow-y-auto rounded border p-2 text-xs">
                {formatResult(result)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
