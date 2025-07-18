import React, { useState, useCallback, useEffect } from "react";
import { useGitStore } from "@/stores/git";
import { useProjectStore } from "@/stores/project";
import { useBufferStore } from "@/stores/buffers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import {
  GitBranch,
  RefreshCw,
  MoreHorizontal,
  Upload,
  Download,
  GitCommit,
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
  ExternalLink,
  GitPullRequest,
  GitMerge,
  Plus,
  Minus,
  Check,
} from "lucide-react";
import {
  getGitStatusColor,
  getGitStatusIcon,
  getGitStatusTooltip,
} from "@/services/git-api";
import { cn } from "@/utils/tailwind";
import path from "path";

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
    loadCommits,
    checkoutBranch,
  } = useGitStore();

  const [commitMessage, setCommitMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["unstaged", "staged", "commits"]),
  );
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [showStageAllDialog, setShowStageAllDialog] = useState(false);
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [showCreateBranchDialog, setShowCreateBranchDialog] = useState(false);
  const [showMergeBranchDialog, setShowMergeBranchDialog] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  // Compute derived state early to use in callbacks
  const unstagedFiles =
    gitStatus?.files.filter(
      (f) => f.workingTreeStatus && f.workingTreeStatus !== " ",
    ) || [];
  const stagedFiles =
    gitStatus?.files.filter((f) => f.indexStatus && f.indexStatus !== " ") ||
    [];

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
    setSelectedFiles((prev) => {
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
    const currentUnstagedFiles =
      gitStatus?.files.filter(
        (f) => f.workingTreeStatus && f.workingTreeStatus !== " ",
      ) || [];
    const allFiles = currentUnstagedFiles.map((f) => f.path);
    setSelectedFiles(new Set(allFiles));
  }, [gitStatus]);

  const handleStageSelected = useCallback(async () => {
    for (const filePath of selectedFiles) {
      await addFile(filePath);
    }
    setSelectedFiles(new Set());
  }, [selectedFiles, addFile]);

  const handleToggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  const handleStageFile = useCallback(
    async (filePath: string) => {
      await addFile(filePath);
    },
    [addFile],
  );

  const handleStageAllFiles = useCallback(async () => {
    await addFile();
  }, [addFile]);

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
        setCommitMessage("");
        setSelectedFiles(new Set());
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
        setCommitMessage("");
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
    console.log("Opening diff view...");
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
    console.log("Rebasing branch...");
    // Implement rebase functionality
  }, []);

  const handleShowGitOutput = useCallback(() => {
    console.log("Showing Git output...");
    // Open a terminal or output panel showing git commands
  }, []);

  const handleOpenInTerminal = useCallback(() => {
    if (currentProject) {
      // Open terminal in the project directory
      console.log("Opening terminal in:", currentProject);
      // You could use an IPC call to open terminal
    }
  }, [currentProject]);

  const handleSettings = useCallback(() => {
    console.log("Opening Git settings...");
    // Open settings panel/modal
  }, []);

  const handleActualCheckout = useCallback(
    async (branchName: string) => {
      try {
        const success = await checkoutBranch(branchName);
        if (success) {
          setShowBranchDialog(false);
          refreshGitStatus();
          loadBranches();
        } else {
          console.error("Failed to checkout branch:", branchName);
        }
      } catch (error) {
        console.error("Failed to checkout branch:", error);
      }
    },
    [checkoutBranch, refreshGitStatus, loadBranches],
  );

  const handleActualCreateBranch = useCallback(async () => {
    if (!newBranchName.trim()) return;

    try {
      console.log("Creating branch:", newBranchName);
      // TODO: Implement branch creation in the git store
      alert(
        "Branch creation not yet implemented. Please use the terminal for now.",
      );
      setNewBranchName("");
      setShowCreateBranchDialog(false);
    } catch (error) {
      console.error("Failed to create branch:", error);
    }
  }, [newBranchName]);

  const handleActualMergeBranch = useCallback(async (branchName: string) => {
    try {
      console.log("Merging branch:", branchName);
      // TODO: Implement branch merging in the git store
      alert(
        "Branch merging not yet implemented. Please use the terminal for now.",
      );
      setShowMergeBranchDialog(false);
    } catch (error) {
      console.error("Failed to merge branch:", error);
    }
  }, []);

  const handleFileClick = useCallback(
    async (filePath: string, event: React.MouseEvent) => {
      // Prevent checkbox toggle when clicking on the file
      if ((event.target as HTMLElement).closest(".checkbox")) {
        return;
      }

      if (!currentProject) return;

      // Construct full file path
      const fullPath = path.join(currentProject.path, filePath);

      // Open the file
      await openFile(fullPath);

      // TODO: Show git diff view for the file
    },
    [currentProject, openFile],
  );

  if (!isGitRepo) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <GitBranch className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
          <p className="text-muted-foreground mb-4 text-sm">
            This folder is not a Git repository
          </p>
          <Button variant="outline" size="sm">
            Initialize Repository
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="bg-card/50 flex flex-shrink-0 items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <GitBranch className="text-muted-foreground h-4 w-4" />
          <span className="font-mono text-sm">{currentBranch}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ChevronDown className="text-muted-foreground h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={handleViewAndCompare}>
                <GitPullRequest className="mr-2 h-4 w-4" />
                View & Compare
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCheckoutBranch}>
                <GitBranch className="mr-2 h-4 w-4" />
                Checkout to...
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCreateBranch}>
                <Plus className="mr-2 h-4 w-4" />
                Create Branch...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleMergeBranch}>
                <GitMerge className="mr-2 h-4 w-4" />
                Merge Branch...
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRebaseBranch}>
                <GitPullRequest className="mr-2 h-4 w-4" />
                Rebase Branch...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleShowGitOutput}>
                <History className="mr-2 h-4 w-4" />
                Show Git Output
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenInTerminal}>
                <Terminal className="mr-2 h-4 w-4" />
                Open in Terminal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSettings}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handlePull}
            disabled={isPulling}
          >
            <Download className="mr-1 h-3 w-3" />
            Pull
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handlePush}
            disabled={isPushing}
          >
            <Upload className="mr-1 h-3 w-3" />
            Push
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleRefresh}
            disabled={isLoadingStatus}
          >
            <RefreshCw
              className={cn("h-3 w-3", isLoadingStatus && "animate-spin")}
            />
          </Button>
        </div>
      </div>

      {/* Changes Section */}
      {unstagedFiles.length > 0 || stagedFiles.length > 0 ? (
        <div className="flex-1 overflow-y-auto">
          {/* Staged Files */}
          {stagedFiles.length > 0 && (
            <>
              <div className="bg-card/30 sticky top-0 flex items-center justify-between border-b px-3 py-2">
                <span className="text-sm font-medium">
                  {stagedFiles.length} Staged Changes
                </span>
              </div>
              <div className="border-b px-1">
                {stagedFiles.map((file) => (
                  <div
                    key={file.path}
                    className="hover:bg-accent/50 group flex cursor-pointer items-center gap-2 px-2 py-1.5"
                    onClick={(e) => handleFileClick(file.path, e)}
                  >
                    <GitCommit className="h-3.5 w-3.5 flex-shrink-0 text-green-600" />
                    <FileText className="text-muted-foreground h-3.5 w-3.5 flex-shrink-0" />
                    <span className="flex-1 truncate text-sm">
                      {file.relativeFilePath}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1 font-mono text-xs",
                        getGitStatusColor(
                          file.workingTreeStatus,
                          file.indexStatus,
                        ),
                      )}
                      title={getGitStatusTooltip(
                        file.workingTreeStatus,
                        file.indexStatus,
                      )}
                    >
                      {getGitStatusIcon(
                        file.workingTreeStatus,
                        file.indexStatus,
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Unstaged Files */}
          {unstagedFiles.length > 0 && (
            <>
              <div className="bg-card/30 sticky top-0 flex items-center justify-between border-b px-3 py-2">
                <span className="text-sm font-medium">
                  {selectedFiles.size > 0 ? `${selectedFiles.size} of ` : ""}
                  {unstagedFiles.length} Changes
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={
                    selectedFiles.size > 0
                      ? handleStageSelected
                      : handleSelectAll
                  }
                >
                  {selectedFiles.size > 0 ? "Stage Selected" : "Stage All"}
                </Button>
              </div>

              <div className="px-1">
                {unstagedFiles.map((file) => (
                  <div
                    key={file.path}
                    className="hover:bg-accent/50 group flex cursor-pointer items-center gap-2 px-2 py-1.5"
                    onClick={(e) => {
                      // Check if clicking on checkbox or its container
                      if (
                        (e.target as HTMLElement).closest(
                          '[role="checkbox"]',
                        ) ||
                        (e.target as HTMLElement).getAttribute("role") ===
                          "checkbox"
                      ) {
                        handleToggleFile(file.path);
                      } else {
                        handleFileClick(file.path, e);
                      }
                    }}
                  >
                    <Checkbox
                      checked={selectedFiles.has(file.path)}
                      className="border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary checkbox h-3.5 w-3.5 rounded-sm"
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={() => handleToggleFile(file.path)}
                    />
                    <FileText className="text-muted-foreground h-3.5 w-3.5 flex-shrink-0" />
                    <span className="flex-1 truncate text-sm">
                      {file.relativeFilePath}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1 font-mono text-xs",
                        getGitStatusColor(
                          file.workingTreeStatus,
                          file.indexStatus,
                        ),
                      )}
                      title={getGitStatusTooltip(
                        file.workingTreeStatus,
                        file.indexStatus,
                      )}
                    >
                      {getGitStatusIcon(
                        file.workingTreeStatus,
                        file.indexStatus,
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">No changes detected</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Make changes to files to see them here
            </p>
          </div>
        </div>
      )}

      {/* Commit Message Section */}
      <div className="bg-card/50 flex-shrink-0 border-t p-3">
        <div className="mb-2 flex items-center gap-2">
          <GitBranch className="text-muted-foreground h-3.5 w-3.5" />
          <span className="text-muted-foreground font-mono text-xs">
            {currentBranch}
          </span>
          <Button
            variant="link"
            size="sm"
            className="ml-auto h-auto p-0 text-xs"
            onClick={() => {}}
          >
            Publish
          </Button>
        </div>
        <Textarea
          placeholder="Enter commit message"
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          className="bg-background/50 border-muted-foreground/20 min-h-[80px] resize-none text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleCommit();
            }
          }}
        />
        <Button
          size="sm"
          className="mt-2 h-8 w-full text-xs"
          onClick={handleCommit}
          disabled={
            !commitMessage.trim() || isCommitting || stagedFiles.length === 0
          }
        >
          {isCommitting
            ? "Committing..."
            : `Commit ${stagedFiles.length > 0 ? `(${stagedFiles.length})` : "Tracked"}`}
        </Button>
      </div>

      {/* Dialog Components */}
      {/* Stage All and Commit Dialog */}
      <AlertDialog
        open={showStageAllDialog}
        onOpenChange={setShowStageAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stage All and Commit</AlertDialogTitle>
            <AlertDialogDescription>
              There are no staged changes to commit. Would you like to stage all
              your changes and commit them directly?
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
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {branches.map((branch) => (
                <div
                  key={branch.name}
                  className={cn(
                    "hover:bg-muted/50 cursor-pointer rounded p-2 text-sm",
                    branch.current && "bg-muted font-medium",
                  )}
                  onClick={() => handleActualCheckout(branch.name)}
                >
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-3 w-3" />
                    <span>{branch.name}</span>
                    {branch.current && (
                      <span className="text-muted-foreground text-xs">
                        (current)
                      </span>
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
      <AlertDialog
        open={showCreateBranchDialog}
        onOpenChange={setShowCreateBranchDialog}
      >
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
                if (e.key === "Enter") {
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
      <AlertDialog
        open={showMergeBranchDialog}
        onOpenChange={setShowMergeBranchDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Merge Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Select a branch to merge into {currentBranch}:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {branches
                .filter((branch) => !branch.current)
                .map((branch) => (
                  <div
                    key={branch.name}
                    className="hover:bg-muted/50 cursor-pointer rounded p-2 text-sm"
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
  );
}
