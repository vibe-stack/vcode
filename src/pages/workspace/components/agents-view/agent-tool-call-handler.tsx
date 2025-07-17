import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
    Check, 
    AlertTriangle, 
    FileText, 
    Folder, 
    Search,
    ChevronDown,
    Loader2,
    Terminal,
    Code,
    Database,
    MoreHorizontal
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
    const [showDetails, setShowDetails] = useState(false);
    console.log("rendering", toolName, args, state, result)

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
        const iconClass = "h-3.5 w-3.5";
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

    const getStatusIcon = () => {
        const iconClass = "h-3.5 w-3.5";
        switch (state) {
            case 'result':
                return <Check className={cn(iconClass, "text-green-600 dark:text-green-400")} />;
            case 'running':
            case 'call':
                return <Loader2 className={cn(iconClass, "animate-spin text-blue-600 dark:text-blue-400")} />;
            case 'error':
                return <AlertTriangle className={cn(iconClass, "text-red-600 dark:text-red-400")} />;
            default:
                return <Check className={cn(iconClass, "text-amber-600 dark:text-amber-400")} />;
        }
    };

    // Render details section with comprehensive tool call data
    const renderDetails = () => {
        const detailsData = {
            toolCallId,
            toolName,
            state,
            args: args || {},
            ...(result && { result }),
            timestamp: new Date().toISOString()
        };

        return (
            <div className="mt-2 pl-8 border-l border-border/30">
                <div className="bg-muted/30 rounded-md p-3 text-xs space-y-3">
                    {/* Tool Call ID */}
                    <div>
                        <span className="font-semibold text-muted-foreground">Call ID:</span>
                        <pre className="font-mono text-muted-foreground mt-1">{toolCallId}</pre>
                    </div>
                    
                    {/* Arguments */}
                    {args && Object.keys(args).length > 0 && (
                        <div>
                            <span className="font-semibold text-muted-foreground">Arguments:</span>
                            <pre className="font-mono text-muted-foreground overflow-x-auto mt-1">
                                {JSON.stringify(args, null, 2)}
                            </pre>
                        </div>
                    )}
                    
                    {/* Result */}
                    {result && (
                        <div>
                            <span className="font-semibold text-muted-foreground">Result:</span>
                            <pre className="font-mono text-muted-foreground overflow-x-auto mt-1">
                                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    )}
                    
                    {/* Full JSON (for debugging) */}
                    <details className="border-t border-border/20 pt-2">
                        <summary className="text-muted-foreground cursor-pointer hover:text-foreground text-xs">
                            Raw JSON Data
                        </summary>
                        <pre className="font-mono text-muted-foreground overflow-x-auto mt-2 text-xs">
                            {JSON.stringify(detailsData, null, 2)}
                        </pre>
                    </details>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-0">
            {/* Main tool call line */}
            <div className="flex items-center gap-2 py-1">
                {/* Status icon */}
                {getStatusIcon()}
                
                {/* Tool icon */}
                <div className="text-muted-foreground">
                    {getToolIcon()}
                </div>
                
                {/* Tool label */}
                <span className="text-sm text-muted-foreground flex-1 truncate">
                    {getToolLabel()}
                </span>

                {/* More details button */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setShowDetails(!showDetails)}
                >
                    <MoreHorizontal className="h-3 w-3 mr-1" />
                    {showDetails ? 'Hide' : 'Details'}
                </Button>
            </div>

            {/* Details section */}
            {showDetails && renderDetails()}
        </div>
    );
}
