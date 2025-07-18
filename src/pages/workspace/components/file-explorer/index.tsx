import React, { useState, useCallback, useEffect } from "react";
import { useProjectStore } from "@/stores/project";
import { useGitStore } from "@/stores/git";
import { useBufferStore } from "@/stores/buffers";
import { useEditorSplitStore } from "@/stores/editor-splits";
import { DirectoryNode } from "@/services/project-api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  MoreHorizontal,
  Files,
  GitBranch,
  FileText,
  FolderPlus,
  Server,
  Package,
  Palette,
} from "lucide-react";
import { FileTreeNode } from "./file-tree-node";
import { GitPanel } from "./git-panel";
import { ToolsPanel } from "./tools-panel";
import { VSCodeExtensionsPanel } from "./vscode-extensions-panel";
import { ThemeManagerPanel } from "./theme-manager-panel";
import { VSCodeExtensionHost } from "../../../../services/vscode-extension-host";
import { ExtensionManagerRenderer } from "../../../../services/extension-manager-renderer";
import { ExtensionInstaller } from "../../../../services/extension-installer";
import { CreateFilePopover } from "./create-file-popover";
import { cn } from "@/utils/tailwind";
import { useSettingsStore } from "@/stores/settings";
import { getActiveAccentClasses } from "@/utils/accent-colors";
import { useEditorContentStore } from "@/stores/editor-content";

export function FileExplorer() {
  const { fileTree, projectName, currentProject } = useProjectStore();
  const { isGitRepo } = useGitStore();
  const { openFile: openFileInSplit, startDrag } = useEditorSplitStore();
  const { settings } = useSettingsStore();
  const accentColor = settings.appearance?.accentColor || "blue";
  const useGradient = settings.appearance?.accentGradient ?? true;
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const { fileExplorerTab } = useEditorContentStore();
  const [extensionHost] = useState(() => new VSCodeExtensionHost());
  const [extensionManager] = useState(() => new ExtensionManagerRenderer(extensionHost));
  const [extensionInstaller] = useState(() => new ExtensionInstaller(extensionHost, extensionManager));

  // Initialize extension manager to load previously installed extensions
  useEffect(() => {
    extensionManager.initialize().catch(error => {
      console.error('Failed to initialize extension manager:', error)
    })
  }, [extensionManager])

  // Listen for webview creation events
  useEffect(() => {
    const handleWebviewCreated = (webviewPanel: any) => {
      console.log('Webview panel created:', webviewPanel)
      // For now, switch to extensions tab when webview is created
      setActiveTab('extensions')
    }

    const handleShowWebview = (webviewPanel: any) => {
      console.log('Show webview panel:', webviewPanel)
      // Switch to extensions tab and show the webview
      setActiveTab('extensions')
    }

    // Add event listeners
    extensionHost.on('webviewCreated', handleWebviewCreated)
    extensionHost.on('showWebview', handleShowWebview)

    // Listen for webview events from main process
    const handleMainProcessWebview = (event: any, webviewPanel: any) => {
      console.log('Webview created in main process:', webviewPanel)
      handleWebviewCreated(webviewPanel)
    }

    // Add IPC listener for main process webview events
    if (window.electronAPI) {
      window.electronAPI.on('extension:webview-created', handleMainProcessWebview)
    }

    // Cleanup
    return () => {
      extensionHost.off('webviewCreated', handleWebviewCreated)
      extensionHost.off('showWebview', handleShowWebview)
      
      if (window.electronAPI) {
        window.electronAPI.off('extension:webview-created', handleMainProcessWebview)
      }
    }
  }, [extensionHost])

  // Extensions are loaded on demand - no auto-installation of mocks

  const handleFileClick = useCallback(
    async (filePath: string) => {
      try {
        // Use the split store to open the file
        await openFileInSplit(filePath);
      } catch (error) {
        console.error("Failed to open file:", error);
      }
    },
    [openFileInSplit],
  );

  const handleFileDragStart = useCallback(
    (filePath: string, event: React.DragEvent) => {
      startDrag("file", filePath);
    },
    [startDrag],
  );

  const handleNodeRenamed = useCallback((oldPath: string, newPath: string) => {
    // Handle file/folder rename in the store
    // This might need to refresh the file tree
    console.log("Node renamed:", oldPath, "->", newPath);
  }, []);

  const handleNodeDeleted = useCallback((path: string) => {
    // Handle file/folder deletion in the store
    // This might need to refresh the file tree
    console.log("Node deleted:", path);
  }, []);

  const handleToggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  // Helper to sort children: folders first (alphabetically), then files (alphabetically)
  const sortChildren = (children: DirectoryNode[]): DirectoryNode[] => {
    return [...children].sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === "directory" ? -1 : 1;
    });
  };

  const filteredTree = useCallback(
    (node: DirectoryNode): DirectoryNode | null => {
      if (!searchQuery.trim()) {
        if (node.type === "directory" && node.children) {
          return {
            ...node,
            children: sortChildren(node.children)
              .map((child) => filteredTree(child))
              .filter(Boolean) as DirectoryNode[],
          };
        }
        return node;
      }

      const query = searchQuery.toLowerCase();
      const matchesSearch = node.name.toLowerCase().includes(query);

      if (node.type === "file") {
        return matchesSearch ? node : null;
      }

      // For directories, check if any children match
      const filteredChildren =
        node.children?.map((child) => filteredTree(child)).filter(Boolean) ||
        [];

      if (matchesSearch || filteredChildren.length > 0) {
        return {
          ...node,
          children: sortChildren(filteredChildren as DirectoryNode[]),
        };
      }

      return null;
    },
    [searchQuery],
  );

  if (!fileTree) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">No project loaded</p>
      </div>
    );
  }

  const displayTree = filteredTree(fileTree);

  return (
    <div className="flex h-full max-h-full flex-col border-r overflow-hidden">
      <Tabs
        value={fileExplorerTab}
        className="flex h-full max-h-full flex-col overflow-hidden"
      >

        {/* Files Tab */}
        <TabsContent
          value="files"
          className="m-0 flex flex-1 flex-col overflow-hidden p-0"
        >
          {/* Search Header */}
          <div className="from-background to-background/80 flex flex-row gap-2 border-b bg-gradient-to-b px-3 py-2.5 flex-shrink-0">
            <div className="relative grow">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 transform" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 rounded-lg pl-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-1">
              <CreateFilePopover
                basePath={currentProject || ""}
                defaultType="file"
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-lg p-0"
                    title="Create file"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                }
              />
              <CreateFilePopover
                basePath={currentProject || ""}
                defaultType="folder"
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-lg p-0"
                    title="Create folder"
                  >
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                }
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-lg p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* File Tree */}
          <ScrollArea className="flex-1 overflow-hidden">
            <div className="p-1">
              {displayTree ? (
                <FileTreeNode
                  node={displayTree}
                  level={0}
                  onFileClick={handleFileClick}
                  onFileDragStart={handleFileDragStart}
                  expandedFolders={expandedFolders}
                  onToggleFolder={handleToggleFolder}
                  onNodeRenamed={handleNodeRenamed}
                  onNodeDeleted={handleNodeDeleted}
                />
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    No files found
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Git Tab */}
        <TabsContent
          value="git"
          className="m-0 flex flex-1 flex-col overflow-hidden p-0"
        >
          <GitPanel />
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent
          value="tools"
          className="m-0 flex flex-1 flex-col overflow-hidden p-0"
        >
          <div className="p-2">
            <ToolsPanel />
          </div>
        </TabsContent>

        {/* Extensions Tab */}
        <TabsContent
          value="extensions"
          className="m-0 flex flex-1 flex-col overflow-hidden p-0"
        >
          <div className="p-2">
            <VSCodeExtensionsPanel 
              extensionHost={extensionHost} 
              extensionManager={extensionManager}
            />
          </div>
        </TabsContent>

        {/* Themes Tab */}
        <TabsContent
          value="themes"
          className="m-0 flex flex-1 flex-col overflow-hidden p-0"
        >
          <div className="p-2">
            <ThemeManagerPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
