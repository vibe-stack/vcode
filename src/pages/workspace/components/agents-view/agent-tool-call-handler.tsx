import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Play, 
    Check, 
    AlertTriangle, 
    FileText, 
    Folder, 
    Search,
    ChevronDown,
    ChevronRight,
    Loader2,
    Terminal,
    Code,
    Database
} from 'lucide-react';
import { cn } from '@/utils/tailwind';

interface AgentToolCallHandlerProps {
    toolCallId: string;
    toolName: string;
    args: any;
    state: 'call' | 'result' | 'running' | 'error' | string;
    result?: any;
}

export function AgentToolCallHandler({ 
    toolCallId, 
    toolName, 
    args, 
    state, 
    result 
}: AgentToolCallHandlerProps) {
    const [expanded, setExpanded] = useState(false);

    // Helper to get filename from path
    const getFileName = (filePath: string): string => {
        if (!filePath) return '';
        return filePath.split('/').pop() || filePath;
    };

    // Get meaningful tool label based on tool type and args
    const getToolLabel = () => {
        switch (toolName) {
            case 'readFile':
            case 'read_file':
                return `Read ${getFileName(args?.filePath || args?.path || '')}`;
            case 'writeFile':
            case 'write_file':
            case 'create_file':
                return `Write ${getFileName(args?.filePath || args?.path || '')}`;
            case 'listDirectory':
            case 'list_directory':
            case 'list_dir':
                return `List ${getFileName(args?.dirPath || args?.path || '')}`;
            case 'createDirectory':
            case 'create_directory':
                return `Create ${getFileName(args?.dirPath || args?.path || '')}`;
            case 'deleteFile':
            case 'delete_file':
                return `Delete ${getFileName(args?.filePath || args?.path || '')}`;
            case 'searchFiles':
            case 'search_files':
            case 'grep_search':
                return `Search "${args?.query || args?.pattern || ''}"`;
            case 'run_in_terminal':
            case 'runCommand':
                return `Run: ${args?.command || ''}`;
            case 'getProjectInfo':
            case 'get_project_info':
                return 'Get project info';
            default:
                return toolName.replace(/_/g, ' ');
        }
    };

    const getToolIcon = () => {
        const iconClass = "h-3 w-3";
        switch (toolName) {
            case 'readFile':
            case 'writeFile':
            case 'read_file':
            case 'write_file':
            case 'create_file':
                return <FileText className={iconClass} />;
            case 'listDirectory':
            case 'createDirectory':
            case 'list_directory':
            case 'create_directory':
            case 'list_dir':
                return <Folder className={iconClass} />;
            case 'searchFiles':
            case 'search_files':
            case 'grep_search':
                return <Search className={iconClass} />;
            case 'run_in_terminal':
            case 'runCommand':
                return <Terminal className={iconClass} />;
            case 'semantic_search':
                return <Database className={iconClass} />;
            default:
                return <Code className={iconClass} />;
        }
    };

    const getStateColor = () => {
        switch (state) {
            case 'result':
                return 'text-green-600 dark:text-green-400';
            case 'running':
            case 'call':
                return 'text-blue-600 dark:text-blue-400';
            case 'error':
                return 'text-red-600 dark:text-red-400';
            default:
                return 'text-amber-600 dark:text-amber-400';
        }
    };

    const getStateIcon = () => {
        const iconClass = "h-3 w-3";
        switch (state) {
            case 'result':
                return <Check className={iconClass} />;
            case 'running':
            case 'call':
                return <Loader2 className={cn(iconClass, "animate-spin")} />;
            case 'error':
                return <AlertTriangle className={iconClass} />;
            default:
                return <Play className={iconClass} />;
        }
    };

    // Render tool arguments in a readable way
    const renderArgs = () => {
        if (!args || Object.keys(args).length === 0) return null;

        return (
            <div className="mt-2 space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Arguments:</div>
                <div className="text-xs bg-muted/50 rounded p-2 font-mono">
                    {Object.entries(args).map(([key, value]) => (
                        <div key={key} className="truncate">
                            <span className="text-blue-600 dark:text-blue-400">{key}:</span>{' '}
                            <span className="text-foreground">
                                {typeof value === 'string' ? value : JSON.stringify(value)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render tool result in a readable way
    const renderResult = () => {
        if (!result) return null;

        let displayResult = result;
        if (typeof result === 'object') {
            displayResult = JSON.stringify(result, null, 2);
        }

        return (
            <div className="mt-2 space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Result:</div>
                <div className="text-xs bg-muted/30 rounded p-2 font-mono max-h-32 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-foreground">
                        {displayResult}
                    </pre>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-2 border border-border/50 rounded-lg p-3 bg-muted/20">
            <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 rounded p-1 -m-1 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className={cn("flex items-center gap-1", getStateColor())}>
                    {getStateIcon()}
                    {getToolIcon()}
                </div>
                
                <span className="text-sm font-medium flex-1">
                    {getToolLabel()}
                </span>

                <Badge 
                    variant={state === 'result' ? 'default' : state === 'error' ? 'destructive' : 'secondary'}
                    className="text-xs"
                >
                    {state}
                </Badge>

                {expanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
            </div>

            {expanded && (
                <div className="space-y-2 pl-6 border-l-2 border-border/30">
                    {renderArgs()}
                    {state === 'result' && renderResult()}
                    {state === 'error' && result && (
                        <div className="mt-2 space-y-1">
                            <div className="text-xs font-medium text-red-600 dark:text-red-400">Error:</div>
                            <div className="text-xs bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded p-2">
                                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
