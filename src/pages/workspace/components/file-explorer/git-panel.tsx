import React, { useState, useCallback, useEffect } from 'react';
import { useGitStore } from '@/stores/git';
import { useProjectStore } from '@/stores/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    GitBranch,
    RefreshCw,
    Plus,
    Minus,
    MoreHorizontal,
    ArrowUp,
    ArrowDown,
    GitCommit,
    GitPullRequest,
    GitMerge,
    Check,
    X,
    FileText,
    FolderOpen
} from 'lucide-react';
import { getGitStatusColor, getGitStatusIcon, getGitStatusTooltip } from '@/services/git-api';
import { cn } from '@/utils/tailwind';

export function GitPanel() {
    const { currentProject } = useProjectStore();
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
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['unstaged', 'staged']));
    const [isCommitting, setIsCommitting] = useState(false);
    const [isPushing, setIsPushing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);

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
        loadBranches();
        loadCommits();
    }, [refreshGitStatus, loadBranches, loadCommits]);

    const handleToggleSection = useCallback((section: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(section)) {
                newSet.delete(section);
            } else {
                newSet.add(section);
            }
            return newSet;
        });
    }, []);

    const handleStageFile = useCallback(async (filePath: string) => {
        await addFile(filePath);
    }, [addFile]);

    const handleStageAllFiles = useCallback(async () => {
        await addFile(); // No filePath stages all files
    }, [addFile]);

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

    const unstagedFiles = gitStatus?.files.filter(f => f.workingTreeStatus && f.workingTreeStatus !== ' ') || [];
    const stagedFiles = gitStatus?.files.filter(f => f.indexStatus && f.indexStatus !== ' ') || [];

    return (
        <div className="h-full overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="border-b p-3 flex flex-col gap-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        <span className="font-mono text-sm">{currentBranch}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={handleRefresh}
                            disabled={isLoadingStatus}
                        >
                            <RefreshCw className={cn("h-3 w-3", isLoadingStatus && "animate-spin")} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {/* Remote Actions */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={handlePull}
                        disabled={isPulling}
                    >
                        <ArrowDown className="h-3 w-3 mr-1" />
                        Pull
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={handlePush}
                        disabled={isPushing}
                    >
                        <ArrowUp className="h-3 w-3 mr-1" />
                        Push
                    </Button>
                </div>
            </div>


            <div className="p-2 space-y-3">
                {/* Commit Section */}
                <Card className="border-0 shadow-none">
                    <CardHeader className="pb-2 px-3 pt-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <GitCommit className="h-4 w-4" />
                            Commit Changes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                        <div className="space-y-2">
                            <Textarea
                                placeholder="Commit message..."
                                value={commitMessage}
                                onChange={(e) => setCommitMessage(e.target.value)}
                                className="min-h-[60px] text-sm resize-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                        handleCommit();
                                    }
                                }}
                            />
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1 h-7 text-xs"
                                    onClick={handleCommit}
                                    disabled={!commitMessage.trim() || isCommitting || stagedFiles.length === 0}
                                >
                                    {isCommitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                                            Committing...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-3 w-3 mr-1" />
                                            Commit ({stagedFiles.length})
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Staged Changes */}
                <Card className="border-0 shadow-none">
                    <CardHeader
                        className="pb-1 px-3 pt-2 cursor-pointer"
                        onClick={() => handleToggleSection('staged')}
                    >
                        <CardTitle className="text-sm flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                {expandedSections.has('staged') ? (
                                    <Minus className="h-3 w-3" />
                                ) : (
                                    <Plus className="h-3 w-3" />
                                )}
                                <span>Staged Changes</span>
                            </div>
                            <Badge variant="outline" className="ml-auto">
                                {stagedFiles.length}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    {expandedSections.has('staged') && (
                        <CardContent className="px-3 pb-2">
                            {stagedFiles.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-2">No staged changes</p>
                            ) : (
                                <div className="space-y-1">
                                    {stagedFiles.map((file) => (
                                        <div
                                            key={file.path}
                                            className="flex items-center gap-2 p-1 rounded text-xs hover:bg-accent group"
                                        >
                                            <FileText className="h-3 w-3 text-muted-foreground" />
                                            <span className="flex-1 truncate">{file.relativeFilePath}</span>
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
                            )}
                        </CardContent>
                    )}
                </Card>

                {/* Unstaged Changes */}
                <Card className="border-0 shadow-none">
                    <CardHeader
                        className="pb-1 px-3 pt-2 cursor-pointer"
                        onClick={() => handleToggleSection('unstaged')}
                    >
                        <CardTitle className="text-sm flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                {expandedSections.has('unstaged') ? (
                                    <Minus className="h-3 w-3" />
                                ) : (
                                    <Plus className="h-3 w-3" />
                                )}
                                <span>Changes</span>
                            </div>
                            <div className="flex items-center gap-1 ml-auto">
                                <Badge variant="outline">
                                    {unstagedFiles.length}
                                </Badge>
                                {unstagedFiles.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-4 w-4 p-0"
                                        onClick={handleStageAllFiles}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </CardTitle>
                    </CardHeader>
                    {expandedSections.has('unstaged') && (
                        <CardContent className="px-3 pb-2">
                            {unstagedFiles.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-2">No changes</p>
                            ) : (
                                <div className="space-y-1">
                                    {unstagedFiles.map((file) => (
                                        <div
                                            key={file.path}
                                            className="flex items-center gap-2 p-1 rounded text-xs hover:bg-accent group"
                                        >
                                            <FileText className="h-3 w-3 text-muted-foreground" />
                                            <span className="flex-1 truncate">{file.relativeFilePath}</span>
                                            <span
                                                className={cn(
                                                    "font-mono text-xs px-1 rounded",
                                                    getGitStatusColor(file.workingTreeStatus, file.indexStatus)
                                                )}
                                                title={getGitStatusTooltip(file.workingTreeStatus, file.indexStatus)}
                                            >
                                                {getGitStatusIcon(file.workingTreeStatus, file.indexStatus)}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                                                onClick={() => handleStageFile(file.path)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>

                {/* Recent Commits */}
                <Card className="border-0 shadow-none">
                    <CardHeader className="pb-1 px-3 pt-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <GitCommit className="h-4 w-4" />
                            Recent Commits
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                        {commits.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-2">No commits yet</p>
                        ) : (
                            <div className="space-y-2">
                                {commits.slice(0, 5).map((commit) => (
                                    <div
                                        key={commit.hash}
                                        className="text-xs p-2 rounded border hover:bg-accent"
                                    >
                                        <div className="font-mono text-muted-foreground mb-1">
                                            {commit.hash.substring(0, 7)}
                                        </div>
                                        <div className="text-foreground mb-1">
                                            {commit.message}
                                        </div>
                                        <div className="text-muted-foreground">
                                            {commit.author} • {new Date(commit.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
