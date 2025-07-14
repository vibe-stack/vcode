import React, { useState, useCallback, useEffect } from 'react';
import { useGitStore } from '@/stores/git';
import { useProjectStore } from '@/stores/project';
import { useBufferStore } from '@/stores/buffers';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    GitBranch,
    RefreshCw,
    MoreHorizontal,
    Upload,
    Download,
    GitCommit,
    FileText,
    ChevronDown
} from 'lucide-react';
import { getGitStatusColor, getGitStatusIcon, getGitStatusTooltip } from '@/services/git-api';
import { cn } from '@/utils/tailwind';
import path from 'path';

export function GitPanel() {
    const { currentProject } = useProjectStore();
    const { openFile } = useBufferStore();
    const {
        gitStatus,
        isGitRepo,
        currentBranch,
        branches,
        commits,
        isLoadingStatus,
        refreshGitStatus,
        addFile,
        commitChanges,
        pushChanges,
        pullChanges,
        loadBranches,
        loadCommits
    } = useGitStore();

    const [commitMessage, setCommitMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [isCommitting, setIsCommitting] = useState(false);
    const [isPushing, setIsPushing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    
    // Compute derived state early to use in callbacks
    const unstagedFiles = gitStatus?.files.filter(f => f.workingTreeStatus && f.workingTreeStatus !== ' ') || [];
    const stagedFiles = gitStatus?.files.filter(f => f.indexStatus && f.indexStatus !== ' ') || [];

    // Load initial data when component mounts
    useEffect(() => {
        if (!isGitRepo || !currentProject) return;

        // Load initial git data
        refreshGitStatus();
        loadBranches();
        loadCommits();
    }, [isGitRepo, currentProject, refreshGitStatus, loadBranches, loadCommits]);

    const handleRefresh = useCallback(() => {
        refreshGitStatus();
    }, [refreshGitStatus]);

    const handleToggleFile = useCallback((filePath: string) => {
        setSelectedFiles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(filePath)) {
                newSet.delete(filePath);
            } else {
                newSet.add(filePath);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        // Re-compute unstaged files inside the callback to avoid closure issues
        const currentUnstagedFiles = gitStatus?.files.filter(f => f.workingTreeStatus && f.workingTreeStatus !== ' ') || [];
        const allFiles = currentUnstagedFiles.map(f => f.path);
        setSelectedFiles(new Set(allFiles));
    }, [gitStatus]);

    const handleStageSelected = useCallback(async () => {
        for (const filePath of selectedFiles) {
            await addFile(filePath);
        }
        setSelectedFiles(new Set());
    }, [selectedFiles, addFile]);

    const handleCommit = useCallback(async () => {
        if (!commitMessage.trim()) return;

        setIsCommitting(true);
        try {
            const success = await commitChanges(commitMessage);
            if (success) {
                setCommitMessage('');
            }
        } finally {
            setIsCommitting(false);
        }
    }, [commitMessage, commitChanges]);

    const handlePush = useCallback(async () => {
        setIsPushing(true);
        try {
            await pushChanges();
        } finally {
            setIsPushing(false);
        }
    }, [pushChanges]);

    const handlePull = useCallback(async () => {
        setIsPulling(true);
        try {
            await pullChanges();
        } finally {
            setIsPulling(false);
        }
    }, [pullChanges]);

    const handleFileClick = useCallback(async (filePath: string, event: React.MouseEvent) => {
        // Prevent checkbox toggle when clicking on the file
        if ((event.target as HTMLElement).closest('.checkbox')) {
            return;
        }
        
        if (!currentProject) return;
        
        // Construct full file path
        const fullPath = path.join(currentProject.path, filePath);
        
        // Open the file
        await openFile(fullPath);
        
        // TODO: Show git diff view for the file
    }, [currentProject, openFile]);

    if (!isGitRepo) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <div className="text-center">
                    <GitBranch className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm mb-4">This folder is not a Git repository</p>
                    <Button variant="outline" size="sm">
                        Initialize Repository
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto flex flex-col bg-background">
            {/* Header */}
            <div className="p-3 flex items-center justify-between flex-shrink-0 bg-card/50">
                <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{currentBranch}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={handlePull}
                        disabled={isPulling}
                    >
                        <Download className="h-3 w-3 mr-1" />
                        Pull
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={handlePush}
                        disabled={isPushing}
                    >
                        <Upload className="h-3 w-3 mr-1" />
                        Push
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={handleRefresh}
                        disabled={isLoadingStatus}
                    >
                        <RefreshCw className={cn("h-3 w-3", isLoadingStatus && "animate-spin")} />
                    </Button>
                </div>
            </div>


            {/* Changes Section */}
            {(unstagedFiles.length > 0 || stagedFiles.length > 0) ? (
                <div className="flex-1 overflow-y-auto">
                    {/* Staged Files */}
                    {stagedFiles.length > 0 && (
                        <>
                            <div className="border-b bg-card/30 px-3 py-2 flex items-center justify-between sticky top-0">
                                <span className="text-sm font-medium">
                                    {stagedFiles.length} Staged Changes
                                </span>
                            </div>
                            <div className="px-1 border-b">
                                {stagedFiles.map((file) => (
                                    <div
                                        key={file.path}
                                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent/50 group cursor-pointer"
                                        onClick={(e) => handleFileClick(file.path, e)}
                                    >
                                        <GitCommit className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                                        <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        <span className="text-sm truncate flex-1">{file.relativeFilePath}</span>
                                        <span
                                            className={cn(
                                                "font-mono text-xs px-1 rounded",
                                                getGitStatusColor(file.workingTreeStatus, file.indexStatus)
                                            )}
                                            title={getGitStatusTooltip(file.workingTreeStatus, file.indexStatus)}
                                        >
                                            {getGitStatusIcon(file.workingTreeStatus, file.indexStatus)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    
                    {/* Unstaged Files */}
                    {unstagedFiles.length > 0 && (
                        <>
                            <div className="border-b bg-card/30 px-3 py-2 flex items-center justify-between sticky top-0">
                                <span className="text-sm font-medium">
                                    {selectedFiles.size > 0 ? `${selectedFiles.size} of ` : ''}
                                    {unstagedFiles.length} Changes
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={selectedFiles.size > 0 ? handleStageSelected : handleSelectAll}
                                >
                                    {selectedFiles.size > 0 ? 'Stage Selected' : 'Stage All'}
                                </Button>
                            </div>
                            
                            <div className="px-1">
                                {unstagedFiles.map((file) => (
                                    <div
                                        key={file.path}
                                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent/50 group cursor-pointer"
                                        onClick={(e) => {
                                            // Check if clicking on checkbox or its container
                                            if ((e.target as HTMLElement).closest('[role="checkbox"]') || 
                                                (e.target as HTMLElement).getAttribute('role') === 'checkbox') {
                                                handleToggleFile(file.path);
                                            } else {
                                                handleFileClick(file.path, e);
                                            }
                                        }}
                                    >
                                        <Checkbox
                                            checked={selectedFiles.has(file.path)}
                                            className="h-3.5 w-3.5 rounded-sm border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary checkbox"
                                            onClick={(e) => e.stopPropagation()}
                                            onCheckedChange={() => handleToggleFile(file.path)}
                                        />
                                        <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        <span className="text-sm truncate flex-1">{file.relativeFilePath}</span>
                                        <span
                                            className={cn(
                                                "font-mono text-xs px-1 rounded",
                                                getGitStatusColor(file.workingTreeStatus, file.indexStatus)
                                            )}
                                            title={getGitStatusTooltip(file.workingTreeStatus, file.indexStatus)}
                                        >
                                            {getGitStatusIcon(file.workingTreeStatus, file.indexStatus)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center">
                        <p className="text-muted-foreground text-sm">No changes detected</p>
                        <p className="text-muted-foreground text-xs mt-1">Make changes to files to see them here</p>
                    </div>
                </div>
            )}

            {/* Commit Message Section */}
            <div className="border-t bg-card/50 p-3 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                    <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground">{currentBranch}</span>
                    <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs ml-auto"
                        onClick={() => {}}
                    >
                        Publish
                    </Button>
                </div>
                <Textarea
                    placeholder="Enter commit message"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="min-h-[80px] text-sm resize-none bg-background/50 border-muted-foreground/20"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            handleCommit();
                        }
                    }}
                />
                <Button
                    size="sm"
                    className="w-full mt-2 h-8 text-xs"
                    onClick={handleCommit}
                    disabled={!commitMessage.trim() || isCommitting || stagedFiles.length === 0}
                >
                    {isCommitting ? 'Committing...' : `Commit ${stagedFiles.length > 0 ? `(${stagedFiles.length})` : 'Tracked'}`}
                </Button>
            </div>
        </div>
    );
}