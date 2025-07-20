import { useBufferStore } from "@/stores/buffers";
import { useProjectStore } from "@/stores/project";
import { useTerminalStore } from "@/stores/terminal";
import { detectLineEnding, detectIndentation, detectEncoding, getLanguageFromExtension } from "@/stores/buffers/utils";
import { Button } from "@/components/ui/button";
import { BotIcon, CodeIcon, Sparkles, Terminal, Check } from "lucide-react";
import React, { useState, useEffect } from "react";
import { GitBranchSwitcher } from "./git-branch-switcher";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useEditorContentStore } from "@/stores/editor-content";

let indexingRun: string | null = null; // Flag to prevent multiple indexing runs

export function WorkspaceFooter() {
    const { currentProject } = useProjectStore();
    const { buffers, activeBufferId } = useBufferStore();
    const { view, setView } = useEditorContentStore();
    const { isVisible: isTerminalVisible, setVisible: setTerminalVisible, tabs, createTab } = useTerminalStore();

    // Index status state
    const [indexStatus, setIndexStatus] = useState<{
        isBuilt: boolean;
        isBuilding: boolean;
        progress: number;
        message?: string;
    }>({
        isBuilt: false,
        isBuilding: false,
        progress: 0
    });

    useEffect(() => {
        // Check initial index status
        const checkIndexStatus = async () => {
            try {
                const status = await window.indexApi?.getStatus();
                if (status) {
                    setIndexStatus(prev => ({
                        ...prev,
                        isBuilt: status.isBuilt,
                        isBuilding: false
                    }));
                }
            } catch (error) {
                console.error('Failed to check index status:', error);
            }
        };

        checkIndexStatus();

        // Set up listeners for index progress and completion
        if (window.indexApi) {
            window.indexApi.onProgress((data) => {
                setIndexStatus(prev => ({
                    ...prev,
                    isBuilding: true,
                    progress: data.progress,
                    message: data.message
                }));

                // When progress reaches 100%, mark as built
                if (data.progress >= 100) {
                    setTimeout(() => {
                        setIndexStatus(prev => ({
                            ...prev,
                            isBuilt: true,
                            isBuilding: false,
                            progress: 100
                        }));
                    }, 1000); // Small delay to show completion
                }
            });

            window.indexApi.onError(() => {
                setIndexStatus(prev => ({
                    ...prev,
                    isBuilding: false,
                    progress: 0
                }));
            });
        }

        return () => {
            window.indexApi?.removeAllListeners();
        };
    }, []);

    useEffect(() => {
        if (currentProject && indexingRun !== currentProject) {
            indexingRun = currentProject; // Set the flag to prevent multiple runs
            window.indexApi.buildIndex({
                projectPath: currentProject,
                includePatterns: [
                    '**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx',
                    '**/*.html', '**/*.css', '**/*.scss', '**/*.less',
                    '**/*.md', '**/*.json', '**/*.yaml', '**/*.yml'
                ],
                excludePatterns: [
                    '**/node_modules/**',
                    '**/dist/**',
                    '**/build/**',
                    '**/.git/**',
                    '**/.next/**',
                    '**/out/**',
                    '**/target/**',
                    '**/.vscode/**',
                    '**/.idea/**',
                    '**/coverage/**',
                    '**/*.log',
                    '**/.DS_Store',
                    // Lock files and package manager artifacts
                    '**/package-lock.json',
                    '**/yarn.lock',
                    '**/pnpm-lock.yaml',
                    '**/Cargo.lock',
                    '**/Gemfile.lock',
                    '**/composer.lock',
                    '**/Pipfile.lock',
                    '**/poetry.lock',
                    // Build and cache directories
                    '**/.cache/**',
                    '**/tmp/**',
                    '**/temp/**',
                    '**/.tmp/**',
                    '**/.nuxt/**',
                    '**/.svelte-kit/**',
                    // More artifacts
                    '**/*.min.js',
                    '**/*.min.css',
                    '**/*.bundle.*',
                    '**/*.chunk.*',
                    '**/*.map'
                ],
                chunkOverlap: 50,
                chunkSize: 400,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentProject])

    const handleToggleTerminal = async () => {
        if (!isTerminalVisible) {
            // If terminal is not visible and we're about to show it, check if we have any terminals
            if (tabs.length === 0) {
                // No terminals exist, create one automatically
                try {
                    const terminalInfo = await window.terminalApi.create({
                        title: 'Terminal 1',
                        cwd: currentProject || undefined
                    });
                    createTab(terminalInfo);
                } catch (error) {
                    console.error('Failed to create default terminal:', error);
                    // Still show the terminal UI even if creation fails
                    setTerminalVisible(true);
                }
            } else {
                // Terminals exist, just show the panel
                setTerminalVisible(true);
            }
        } else {
            // Hide the terminal
            setTerminalVisible(false);
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

    const renderIndexStatus = () => {
        if (indexStatus.isBuilding) {
            return (
                <div className="text-white text-xs">
                    Indexing {Math.round(indexStatus.progress)}%
                </div>
            );
        }

        if (indexStatus.isBuilt) {
            return (
                <div className="flex items-center gap-1 text-white text-xs">
                    <Check className="h-3 w-3" />
                    Index
                </div>
            );
        }

        return null;
    };

    return (
        <footer className="workspace-footer w-full h-8 bg-background border-t text-white flex items-center justify-between px-4 text-xs">
            <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                    <GitBranchSwitcher />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleTerminal}
                        className="h-5 px-2 hover:bg-gray-700"
                    >
                        <Terminal className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline text-xs">Terminal</span>
                    </Button>
                </div>

                <div className="flex items-center gap-4">
                    <ToggleGroup type="single" size="sm" className="py-0.5 px-0.5" value={view} onValueChange={setView}>
                        <ToggleGroupItem value="code" className="text-xs ">
                            <div className="flex flex-row gap-0.5">
                                <CodeIcon className="h-3 w-3" />
                                <span>Code</span>
                            </div>
                        </ToggleGroupItem>
                        <ToggleGroupItem value="agents" className="text-xs">
                            <div className="flex flex-row gap-0.5">
                                <BotIcon className="h-3 w-3" />
                                <span>Agents</span>
                            </div>
                        </ToggleGroupItem>
                        <ToggleGroupItem value="auto" className="text-xs">
                            <div className="flex flex-row gap-0.5">
                                <Sparkles className="h-3 w-3" />
                                <span>Auto</span>
                            </div>
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                <div className="flex items-center gap-4">
                    {renderIndexStatus()}
                    {activeBuffer?.cursorPosition && (
                        <div className="">
                            Ln {activeBuffer.cursorPosition.line}, Col {activeBuffer.cursorPosition.column}
                        </div>
                    )}
                    {activeBuffer && (
                        <>
                            <div className="">{editorInfo.language}</div>
                            <div className="">{editorInfo.encoding}</div>
                            <div className="">{editorInfo.lineEnding}</div>
                            <div className="">
                                {editorInfo.indentation.type === 'spaces'
                                    ? `Spaces: ${editorInfo.indentation.size}`
                                    : `Tabs: ${editorInfo.indentation.size}`
                                }
                            </div>
                        </>
                    )}
                </div>
            </div>
        </footer>
    )
}
