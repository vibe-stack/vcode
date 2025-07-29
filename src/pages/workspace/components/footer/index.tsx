import { useBufferStore } from "@/stores/buffers";
import { useProjectStore } from "@/stores/project";
import { useTerminalStore } from "@/stores/terminal";
import { detectLineEnding, detectIndentation, detectEncoding, getLanguageFromExtension } from "@/stores/buffers/utils";
import { Button } from "@/components/ui/button";
import { Terminal, Check, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { GitBranchSwitcher } from "./git-branch-switcher";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { typescriptLSPClient } from '@/services/typescript-lsp';
// LSP status types
type LSPStatus = 'running' | 'loading' | 'error' | 'stopped';

import { Switch } from "@/components/ui/switch";


// Persist auto-run setting in localStorage
const AUTO_RUN_KEY = "grok-ide:autoRunIndexing";

export function WorkspaceFooter() {
    const { currentProject } = useProjectStore();
    const { buffers, activeBufferId } = useBufferStore();
    const { isVisible: isTerminalVisible, setVisible: setTerminalVisible, tabs, createTab } = useTerminalStore();

    // LSP status state
    const [lspStatus, setLspStatus] = useState<LSPStatus>('loading');
    const [lspError, setLspError] = useState<string | null>(null);
    const [lspPopoverOpen, setLspPopoverOpen] = useState(false);
    const [lspRestarting, setLspRestarting] = useState(false);

    // Poll LSP status
    useEffect(() => {
        let mounted = true;
        async function pollStatus() {
            setLspStatus('loading');
            setLspError(null);
            try {
                const status = await typescriptLSPClient.getStatus();
                if (!mounted) return;
                if (status.isRunning) {
                    setLspStatus('running');
                } else {
                    setLspStatus('stopped');
                }
            } catch (e: any) {
                setLspStatus('error');
                setLspError(e?.message || 'Unknown error');
            }
        }
        pollStatus();
        const interval = setInterval(pollStatus, 4000);
        return () => { mounted = false; clearInterval(interval); };
    }, []);

    // Restart LSP
    const handleRestartLSP = async () => {
        setLspRestarting(true);
        setLspError(null);
        setLspStatus('loading');
        try {
            if (currentProject) {
                await typescriptLSPClient.initialize(currentProject);
            }
            setLspStatus('running');
        } catch (e: any) {
            setLspStatus('error');
            setLspError(e?.message || 'Failed to restart LSP');
        } finally {
            setLspRestarting(false);
        }
    };


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
                    message: err?.error || 'An error occurred'
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
                    Vibes indexes your codebase locally to allow semantic search of files, this can be used by you on the ask tab or by Grok to search your project files in natural language
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
                    {/* LSP Status Button */}
                    <Popover open={lspPopoverOpen} onOpenChange={setLspPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 px-2 flex items-center gap-1 hover:bg-gray-700"
                                onClick={() => setLspPopoverOpen(true)}
                                aria-label="LSP Status"
                            >
                                {lspStatus === 'loading' && <Loader2 className="h-3 w-3 animate-spin text-yellow-400" />}
                                {lspStatus === 'running' && <Check className="h-3 w-3 text-green-400" />}
                                {lspStatus === 'error' && <AlertCircle className="h-3 w-3 text-red-400" />}
                                {lspStatus === 'stopped' && <AlertCircle className="h-3 w-3 text-gray-400" />}
                                <span className="hidden sm:inline text-xs">
                                    {lspStatus === 'loading' && 'Typescript'}
                                    {lspStatus === 'running' && 'Typescript'}
                                    {lspStatus === 'error' && 'Typescript: Error'}
                                    {lspStatus === 'stopped' && 'Typescript: Stopped'}
                                </span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-4" align="start">
                            <div className="flex flex-col gap-2">
                                <div className="font-bold text-white text-xs mb-1">TypeScript LSP Status</div>
                                <div className="flex items-center gap-2">
                                    {lspStatus === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />}
                                    {lspStatus === 'running' && <Check className="h-4 w-4 text-green-400" />}
                                    {lspStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}
                                    {lspStatus === 'stopped' && <AlertCircle className="h-4 w-4 text-gray-400" />}
                                    <span className="text-xs">
                                        {lspStatus === 'loading' && 'Loading...'}
                                        {lspStatus === 'running' && 'Running'}
                                        {lspStatus === 'error' && 'Error'}
                                        {lspStatus === 'stopped' && 'Stopped'}
                                    </span>
                                </div>
                                {lspError && <div className="text-xs text-red-400">{lspError}</div>}
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="mt-2 flex items-center gap-1"
                                    onClick={handleRestartLSP}
                                    disabled={lspRestarting || lspStatus === 'loading'}
                                >
                                    <RefreshCw className={lspRestarting ? 'animate-spin h-3 w-3' : 'h-3 w-3'} />
                                    {lspRestarting ? 'Restarting...' : 'Restart LSP'}
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
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
                                    <span>Indexing {indexStatus.progress ? Math.round(indexStatus.progress) : 0}%</span>
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
