import { useBufferStore } from "@/stores/buffers";
import { useProjectStore } from "@/stores/project";
import { useTerminalStore } from "@/stores/terminal";
import { detectLineEnding, detectIndentation, detectEncoding, getLanguageFromExtension } from "@/stores/buffers/utils";
import { Button } from "@/components/ui/button";
import { BotIcon, CodeIcon, Sparkles, Terminal, Check } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { GitBranchSwitcher } from "./git-branch-switcher";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useEditorContentStore } from "@/stores/editor-content";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";


// Persist auto-run setting in localStorage
const AUTO_RUN_KEY = "grok-ide:autoRunIndexing";

export function WorkspaceFooter() {
    const { currentProject } = useProjectStore();
    const { buffers, activeBufferId } = useBufferStore();
    const { view, setView } = useEditorContentStore();
    const { isVisible: isTerminalVisible, setVisible: setTerminalVisible, tabs, createTab } = useTerminalStore();


    // Index status state
    const [indexStatus, setIndexStatus] = useState<{
        isBuilt: boolean;
        isBuilding: boolean;
        progress?: number;
        message?: string;
    }>({
        isBuilt: false,
        isBuilding: false,
        progress: undefined,
        message: undefined
    });

    // Auto-run toggle state
    const [autoRun, setAutoRun] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(AUTO_RUN_KEY);
            return stored === null ? false : stored === 'true';
        }
        return false;
    });

    // Popover open state
    const [popoverOpen, setPopoverOpen] = useState(false);


    // Listen for index status/progress
    useEffect(() => {
        // Check initial index status
        const checkIndexStatus = async () => {
            try {
                const status = await window.indexApi?.getStatus();
                if (status) {
                    setIndexStatus(prev => ({
                        ...prev,
                        isBuilt: status.isBuilt,
                        isBuilding: false,
                        progress: undefined,
                        message: undefined
                    }));
                }
            } catch (error) {
                console.error('Failed to check index status:', error);
            }
        };
        checkIndexStatus();

        if (window.indexApi) {
            window.indexApi.onProgress((data) => {
                setIndexStatus(prev => ({
                    ...prev,
                    isBuilding: true,
                    progress: data.progress,
                    message: data.message
                }));
                if (data.progress >= 100) {
                    setTimeout(() => {
                        setIndexStatus(prev => ({
                            ...prev,
                            isBuilt: true,
                            isBuilding: false,
                            progress: undefined,
                            message: undefined
                        }));
                    }, 1000);
                }
            });
            window.indexApi.onError((err) => {
                setIndexStatus(prev => ({
                    ...prev,
                    isBuilding: false,
                    progress: undefined,
                    message: err?.message || undefined
                }));
            });
        }
        return () => {
            window.indexApi?.removeAllListeners();
        };
    }, []);

    // Only auto-run if enabled and project changes
    useEffect(() => {
        if (currentProject && autoRun) {
            runIndexing();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentProject, autoRun]);

    // Run/re-run indexing
    const runIndexing = async () => {
        if (!currentProject) return;
        setIndexStatus(prev => ({ ...prev, isBuilding: true, progress: undefined, message: undefined }));
        try {
            await window.indexApi.buildIndex({
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
        } catch (error) {
            setIndexStatus(prev => ({ ...prev, isBuilding: false, message: 'Failed to start indexing.' }));
        }
    };

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


    // Popover content for indexing controls
    const renderIndexPopover = () => (
        <PopoverContent className="w-96 p-5" align="end">
            <div className="flex flex-col gap-3">
                <div className="font-bold text-white text-xs mb-0.5">Semantic Indexing</div>
                <div className="text-xs text-muted-foreground mb-2">
                    vCode indexes your codebase locally to allow semantic search of files, this can be used by you on the ask tab or by Grok to search your project files in natural language
                </div>
                <div className="text-xs text-muted-foreground">
                    {indexStatus.isBuilding && typeof indexStatus.progress === 'number' && (
                        <span>Indexing in progress: {Math.round(indexStatus.progress)}%</span>
                    )}
                    {indexStatus.isBuilt && !indexStatus.isBuilding && (
                        <span>Index is up to date.</span>
                    )}
                    {!indexStatus.isBuilt && !indexStatus.isBuilding && (
                        <span>Index not built.</span>
                    )}
                </div>
                {indexStatus.message && (
                    <div className="text-xs text-yellow-400 bg-yellow-900/30 rounded px-2 py-1">
                        {indexStatus.message}
                    </div>
                )}
                <div className="flex gap-2 mt-2">
                    {indexStatus.isBuilt ? (
                        <Button size="sm" variant="secondary" onClick={runIndexing} disabled={indexStatus.isBuilding}>
                            Re-run Index
                        </Button>
                    ) : (
                        <Button size="sm" variant="default" onClick={runIndexing} disabled={indexStatus.isBuilding}>
                            Run Indexing
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <Switch
                        id="auto-run-indexing"
                        checked={autoRun}
                        onCheckedChange={checked => {
                            setAutoRun(checked);
                            localStorage.setItem(AUTO_RUN_KEY, checked ? 'true' : 'false');
                        }}
                    />
                    <label htmlFor="auto-run-indexing" className="text-xs cursor-pointer select-none">
                        Auto-run indexing on project start
                    </label>
                </div>
            </div>
        </PopoverContent>
    );

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
                    {/* Index popover trigger */}
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant={indexStatus.isBuilt ? "ghost" : "secondary"}
                                size="sm"
                                className="h-5 px-2 flex items-center gap-1 text-xs"
                                onClick={() => setPopoverOpen(true)}
                            >
                                {indexStatus.isBuilding ? (
                                    <span>Indexing {Math.round(indexStatus.progress)}%</span>
                                ) : indexStatus.isBuilt ? (
                                    <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Index</span>
                                ) : (
                                    <span>Index</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        {renderIndexPopover()}
                    </Popover>
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
