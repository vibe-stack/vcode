import React, { useState, useCallback, useEffect } from 'react';
import { useGitStore } from '@/stores/git';
import { useProjectStore } from '@/stores/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
    FolderOpen,
    ChevronRight,
    ChevronDown,
    History,
    Settings,
    Terminal,
    Eye,
    EyeOff,
    Trash2,
    RotateCcw,
    Copy,
    ExternalLink
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
        loadCommits,
        checkoutBranch
    } = useGitStore();

    const [commitMessage, setCommitMessage] = useState('');
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['unstaged', 'staged', 'commits']));
    const [isCommitting, setIsCommitting] = useState(false);
    const [isPushing, setIsPushing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    const [showStageAllDialog, setShowStageAllDialog] = useState(false);
    const [showBranchDialog, setShowBranchDialog] = useState(false);
    const [showCreateBranchDialog, setShowCreateBranchDialog] = useState(false);
    const [showMergeBranchDialog, setShowMergeBranchDialog] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');

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

    const unstagedFiles = gitStatus?.files.filter(f => f.workingTreeStatus && f.workingTreeStatus !== ' ') || [];
    const stagedFiles = gitStatus?.files.filter(f => f.indexStatus && f.indexStatus !== ' ') || [];

    const handleCommit = useCallback(async () => {
        if (!commitMessage.trim()) return;

        // If no staged files but unstaged files exist, show dialog to stage all
        if (stagedFiles.length === 0 && unstagedFiles.length > 0) {
            setShowStageAllDialog(true);
            return;
        }

        setIsCommitting(true);
        try {
            const success = await commitChanges(commitMessage);
            if (success) {
                setCommitMessage('');
            }
        } finally {
            setIsCommitting(false);
        }
    }, [commitMessage, commitChanges, stagedFiles.length, unstagedFiles.length]);

    const handleStageAllAndCommit = useCallback(async () => {
        setShowStageAllDialog(false);
        setIsCommitting(true);
        try {
            // Stage all files first
            await addFile();
            // Then commit
            const success = await commitChanges(commitMessage);
            if (success) {
                setCommitMessage('');
            }
        } finally {
            setIsCommitting(false);
        }
    }, [commitMessage, commitChanges, addFile]);

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

    // Git menu handlers
    const handleViewAndCompare = useCallback(() => {
        // Open a diff view - could integrate with your existing diff viewer
        console.log('Opening diff view...');
        // You could implement this to show a diff panel or modal
    }, []);

    const handleCheckoutBranch = useCallback(() => {
        setShowBranchDialog(true);
    }, []);

    const handleCreateBranch = useCallback(() => {
        setShowCreateBranchDialog(true);
    }, []);

    const handleMergeBranch = useCallback(() => {
        setShowMergeBranchDialog(true);
    }, []);

    const handleRebaseBranch = useCallback(() => {
        console.log('Rebasing branch...');
        // Implement rebase functionality
    }, []);

    const handleShowGitOutput = useCallback(() => {
        console.log('Showing Git output...');
        // Open a terminal or output panel showing git commands
    }, []);

    const handleOpenInTerminal = useCallback(() => {
        if (currentProject) {
            // Open terminal in the project directory
            console.log('Opening terminal in:', currentProject);
            // You could use an IPC call to open terminal
        }
    }, [currentProject]);

    const handleSettings = useCallback(() => {
        console.log('Opening Git settings...');
        // Open settings panel/modal
    }, []);

    const handleActualCheckout = useCallback(async (branchName: string) => {
        try {
            const success = await checkoutBranch(branchName);
            if (success) {
                setShowBranchDialog(false);
                refreshGitStatus();
                loadBranches();
            } else {
                console.error('Failed to checkout branch:', branchName);
            }
        } catch (error) {
            console.error('Failed to checkout branch:', error);
        }
    }, [checkoutBranch, refreshGitStatus, loadBranches]);

    const handleActualCreateBranch = useCallback(async () => {
        if (!newBranchName.trim()) return;
        
        try {
            console.log('Creating branch:', newBranchName);
            // TODO: Implement branch creation in the git store
            alert('Branch creation not yet implemented. Please use the terminal for now.');
            setNewBranchName('');
            setShowCreateBranchDialog(false);
        } catch (error) {
            console.error('Failed to create branch:', error);
        }
    }, [newBranchName]);

    const handleActualMergeBranch = useCallback(async (branchName: string) => {
        try {
            console.log('Merging branch:', branchName);
            // TODO: Implement branch merging in the git store
            alert('Branch merging not yet implemented. Please use the terminal for now.');
            setShowMergeBranchDialog(false);
        } catch (error) {
            console.error('Failed to merge branch:', error);
        }
    }, []);

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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={handleViewAndCompare}>
                                    <GitPullRequest className="h-4 w-4 mr-2" />
                                    View & Compare
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleCheckoutBranch}>
                                    <GitBranch className="h-4 w-4 mr-2" />
                                    Checkout to...
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleCreateBranch}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Branch...
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleMergeBranch}>
                                    <GitMerge className="h-4 w-4 mr-2" />
                                    Merge Branch...
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleRebaseBranch}>
                                    <GitPullRequest className="h-4 w-4 mr-2" />
                                    Rebase Branch...
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleShowGitOutput}>
                                    <History className="h-4 w-4 mr-2" />
                                    Show Git Output
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleOpenInTerminal}>
                                    <Terminal className="h-4 w-4 mr-2" />
                                    Open in Terminal
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleSettings}>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Settings
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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


            <div className="flex-1 overflow-hidden">
                {/* Commit Section */}
                <div className="px-3 py-2 border-b bg-background">
                    <div className="space-y-2">
                        <Textarea
                            placeholder="Message (press Ctrl+Enter to commit)"
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            className="min-h-[60px] text-sm resize-none border-0 bg-muted/50 focus:bg-background"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                    handleCommit();
                                }
                            }}
                        />
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                className="h-7 text-xs"
                                onClick={handleCommit}
                                disabled={!commitMessage.trim() || isCommitting}
                            >
                                {isCommitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                                        Committing...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-3 w-3 mr-1" />
                                        {stagedFiles.length > 0 ? 'Commit' : 'Commit All'}
                                    </>
                                )}
                            </Button>
                            {stagedFiles.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {stagedFiles.length} staged
                                </span>
                            )}
                            {stagedFiles.length === 0 && unstagedFiles.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {unstagedFiles.length} changes
                                </span>
                            )}
                        </div>

                        {/* Stage All and Commit Dialog */}
                        <AlertDialog open={showStageAllDialog} onOpenChange={setShowStageAllDialog}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Stage All and Commit</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        There are no staged changes to commit. Would you like to stage all your changes and commit them directly?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleStageAllAndCommit}>
                                        Always
                                    </AlertDialogAction>
                                    <AlertDialogAction onClick={handleStageAllAndCommit}>
                                        Yes
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {/* Branch Checkout Dialog */}
                        <AlertDialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Checkout Branch</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Select a branch to checkout to:
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-4">
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {branches.map((branch) => (
                                            <div
                                                key={branch.name}
                                                className={cn(
                                                    "p-2 rounded cursor-pointer hover:bg-muted/50 text-sm",
                                                    branch.current && "bg-muted font-medium"
                                                )}
                                                onClick={() => handleActualCheckout(branch.name)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <GitBranch className="h-3 w-3" />
                                                    <span>{branch.name}</span>
                                                    {branch.current && (
                                                        <span className="text-xs text-muted-foreground">(current)</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {/* Create Branch Dialog */}
                        <AlertDialog open={showCreateBranchDialog} onOpenChange={setShowCreateBranchDialog}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Create Branch</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Enter a name for the new branch:
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-4">
                                    <Input
                                        value={newBranchName}
                                        onChange={(e) => setNewBranchName(e.target.value)}
                                        placeholder="feature/my-new-feature"
                                        className="w-full"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleActualCreateBranch();
                                            }
                                        }}
                                    />
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={handleActualCreateBranch}
                                        disabled={!newBranchName.trim()}
                                    >
                                        Create Branch
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {/* Merge Branch Dialog */}
                        <AlertDialog open={showMergeBranchDialog} onOpenChange={setShowMergeBranchDialog}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Merge Branch</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Select a branch to merge into {currentBranch}:
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-4">
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {branches.filter(branch => !branch.current).map((branch) => (
                                            <div
                                                key={branch.name}
                                                className="p-2 rounded cursor-pointer hover:bg-muted/50 text-sm"
                                                onClick={() => handleActualMergeBranch(branch.name)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <GitBranch className="h-3 w-3" />
                                                    <span>{branch.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                {/* File Changes */}
                <div className="flex-1 overflow-y-auto">
                    {/* Staged Changes */}
                    <div className="border-b">
                        <div
                            className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer select-none"
                            onClick={() => handleToggleSection('staged')}
                        >
                            {expandedSections.has('staged') ? (
                                <ChevronDown className="h-3 w-3" />
                            ) : (
                                <ChevronRight className="h-3 w-3" />
                            )}
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Staged Changes
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {stagedFiles.length}
                            </span>
                        </div>
                        {expandedSections.has('staged') && (
                            <div>
                                {stagedFiles.length === 0 ? (
                                    <div className="px-6 py-2 text-xs text-muted-foreground">
                                        No staged changes
                                    </div>
                                ) : (
                                    <div>
                                        {stagedFiles.map((file) => (
                                            <div
                                                key={file.path}
                                                className="flex items-center gap-2 px-6 py-1 text-xs hover:bg-muted/50 group"
                                            >
                                                <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                <span className="flex-1 truncate">{file.relativeFilePath}</span>
                                                <span
                                                    className={cn(
                                                        "font-mono text-xs w-4 text-center flex-shrink-0",
                                                        getGitStatusColor(file.workingTreeStatus, file.indexStatus)
                                                    )}
                                                    title={getGitStatusTooltip(file.workingTreeStatus, file.indexStatus)}
                                                >
                                                    {getGitStatusIcon(file.workingTreeStatus, file.indexStatus)}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                    onClick={() => handleStageFile(file.path)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Unstaged Changes */}
                    <div className="border-b">
                        <div
                            className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer select-none"
                            onClick={() => handleToggleSection('unstaged')}
                        >
                            {expandedSections.has('unstaged') ? (
                                <ChevronDown className="h-3 w-3" />
                            ) : (
                                <ChevronRight className="h-3 w-3" />
                            )}
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Changes
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {unstagedFiles.length}
                            </span>
                            {unstagedFiles.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 ml-auto opacity-70 hover:opacity-100"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStageAllFiles();
                                    }}
                                    title="Stage All Changes"
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                        {expandedSections.has('unstaged') && (
                            <div>
                                {unstagedFiles.length === 0 ? (
                                    <div className="px-6 py-2 text-xs text-muted-foreground">
                                        No changes
                                    </div>
                                ) : (
                                    <div>
                                        {unstagedFiles.map((file) => (
                                            <div
                                                key={file.path}
                                                className="flex items-center gap-2 px-6 py-1 text-xs hover:bg-muted/50 group"
                                            >
                                                <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                <span className="flex-1 truncate">{file.relativeFilePath}</span>
                                                <span
                                                    className={cn(
                                                        "font-mono text-xs w-4 text-center flex-shrink-0",
                                                        getGitStatusColor(file.workingTreeStatus, file.indexStatus)
                                                    )}
                                                    title={getGitStatusTooltip(file.workingTreeStatus, file.indexStatus)}
                                                >
                                                    {getGitStatusIcon(file.workingTreeStatus, file.indexStatus)}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                    onClick={() => handleStageFile(file.path)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Recent Commits */}
                    <div>
                        <div
                            className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer select-none"
                            onClick={() => handleToggleSection('commits')}
                        >
                            {expandedSections.has('commits') ? (
                                <ChevronDown className="h-3 w-3" />
                            ) : (
                                <ChevronRight className="h-3 w-3" />
                            )}
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Commits
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {commits.length}
                            </span>
                        </div>
                        {expandedSections.has('commits') && (
                            <div>
                                {commits.length === 0 ? (
                                    <div className="px-6 py-2 text-xs text-muted-foreground">
                                        No commits yet
                                    </div>
                                ) : (
                                    <div>
                                        {commits.slice(0, 5).map((commit) => (
                                            <div
                                                key={commit.hash}
                                                className="px-6 py-2 text-xs hover:bg-muted/50 border-l-2 border-transparent hover:border-muted"
                                            >
                                                <div className="font-mono text-muted-foreground mb-1">
                                                    {commit.hash.substring(0, 7)}
                                                </div>
                                                <div className="text-foreground mb-1 line-clamp-2">
                                                    {commit.message}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    {commit.author} • {new Date(commit.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
