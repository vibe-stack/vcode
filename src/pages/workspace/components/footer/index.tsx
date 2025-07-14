import { useBufferStore } from "@/stores/buffers";
import { useProjectStore } from "@/stores/project";
import { useTerminalStore } from "@/stores/terminal";
import { useGitStore } from "@/stores/git";
import { detectLineEnding, detectIndentation, detectEncoding, getLanguageFromExtension } from "@/stores/buffers/utils";
import { Button } from "@/components/ui/button";
import { 
    Terminal, 
    GitBranch, 
    FileCode2, 
    Save, 
    AlertCircle, 
    CheckCircle2,
    XCircle,
    Database,
    Zap,
    Activity
} from "lucide-react";
import React from "react";
import { cn } from "@/utils/tailwind";

export function WorkspaceFooter() {
    const { currentProject } = useProjectStore();
    const { buffers, activeBufferId } = useBufferStore();
    const { isVisible: isTerminalVisible, setVisible: setTerminalVisible, createTab } = useTerminalStore();
    const { currentBranch, isGitRepo } = useGitStore();

    const handleCreateTerminal = async () => {
        try {
            // Create a new terminal
            const terminalInfo = await window.terminalApi.create({
                cwd: currentProject || undefined,
                title: 'Terminal'
            });
            
            // Add it to the store
            createTab(terminalInfo);
            
            // Make sure terminal is visible
            setTerminalVisible(true);
        } catch (error) {
            console.error('Failed to create terminal:', error);
        }
    };

    // Get active buffer reactively from the store
    const activeBuffer = activeBufferId ? buffers.get(activeBufferId) : null;

    // Calculate editor status info
    const editorInfo = React.useMemo(() => {
        if (!activeBuffer || !activeBuffer.content || typeof activeBuffer.content !== 'string') {
            return {
                lineEnding: 'LF',
                indentation: { type: 'spaces' as const, size: 4 },
                encoding: 'UTF-8',
                language: 'Plain Text'
            };
        }

        const content = activeBuffer.content;
        return {
            lineEnding: detectLineEnding(content),
            indentation: detectIndentation(content),
            encoding: detectEncoding(content),
            language: getLanguageFromExtension(activeBuffer.extension)
        };
    }, [activeBuffer?.content, activeBuffer?.extension]);

    // Check if buffer has unsaved changes
    const hasUnsavedChanges = activeBuffer?.isDirty || false;

    return (
        <footer className="workspace-footer w-full h-7 bg-background border-t flex items-center justify-between px-2 text-[11px]" data-status-bar>
            <div className="flex items-center gap-1">
                {/* Git Branch */}
                {isGitRepo && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-2 py-0 hover:bg-accent/50 rounded-sm flex items-center gap-1"
                    >
                        <GitBranch className="h-3 w-3 text-purple-400" />
                        <span className="text-muted-foreground">{currentBranch || 'main'}</span>
                    </Button>
                )}

                {/* Terminal - Create New */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCreateTerminal}
                    className="h-5 px-2 py-0 hover:bg-accent/50 rounded-sm flex items-center gap-1"
                    title="Create new terminal"
                >
                    <Terminal className="h-3 w-3 text-blue-400" />
                    <span className="text-muted-foreground">Terminal</span>
                </Button>

                {/* Status Indicator */}
                <div className="flex items-center gap-1 px-2">
                    {hasUnsavedChanges ? (
                        <>
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                            <span className="text-yellow-400/80">Modified</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="h-3 w-3 text-green-400" />
                            <span className="text-muted-foreground">Ready</span>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1">
                {/* Cursor Position */}
                {activeBuffer?.cursorPosition && (
                    <div className="flex items-center gap-1 px-2 hover:bg-accent/30 rounded-sm cursor-default">
                        <Activity className="h-3 w-3 text-cyan-400" />
                        <span className="text-muted-foreground">
                            Ln {activeBuffer.cursorPosition.line}, Col {activeBuffer.cursorPosition.column}
                        </span>
                    </div>
                )}

                {/* Language Mode */}
                {activeBuffer && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-2 py-0 hover:bg-accent/50 rounded-sm flex items-center gap-1"
                    >
                        <FileCode2 className="h-3 w-3 text-orange-400" />
                        <span className="text-muted-foreground">{editorInfo.language}</span>
                    </Button>
                )}

                {/* Encoding */}
                {activeBuffer && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-2 py-0 hover:bg-accent/50 rounded-sm flex items-center gap-1"
                    >
                        <Database className="h-3 w-3 text-teal-400" />
                        <span className="text-muted-foreground">{editorInfo.encoding}</span>
                    </Button>
                )}

                {/* Indentation */}
                {activeBuffer && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-2 py-0 hover:bg-accent/50 rounded-sm flex items-center gap-1"
                    >
                        <Zap className="h-3 w-3 text-pink-400" />
                        <span className="text-muted-foreground">
                            {editorInfo.indentation.type === 'spaces'
                                ? `${editorInfo.indentation.size} Spaces`
                                : `Tab Size: ${editorInfo.indentation.size}`
                            }
                        </span>
                    </Button>
                )}

                {/* Line Endings */}
                {activeBuffer && (
                    <div className="flex items-center gap-1 px-2 hover:bg-accent/30 rounded-sm cursor-default">
                        <span className="text-muted-foreground text-[10px]">{editorInfo.lineEnding}</span>
                    </div>
                )}
            </div>
        </footer>
    )
}