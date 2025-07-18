import { useBufferStore } from "@/stores/buffers";
import { useProjectStore } from "@/stores/project";
import { useTerminalStore } from "@/stores/terminal";
import { detectLineEnding, detectIndentation, detectEncoding, getLanguageFromExtension } from "@/stores/buffers/utils";
import { Button } from "@/components/ui/button";
import { BotIcon, CodeIcon, Sparkles, Terminal } from "lucide-react";
import React from "react";
import { GitBranchSwitcher } from "./git-branch-switcher";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useEditorContentStore } from "@/stores/editor-content";


export function WorkspaceFooter() {
    const { } = useProjectStore();
    const { buffers, activeBufferId } = useBufferStore();
    const { view, setView } = useEditorContentStore();
    const { isVisible: isTerminalVisible, setVisible: setTerminalVisible } = useTerminalStore();

    const handleToggleTerminal = () => {
        setTerminalVisible(!isTerminalVisible);
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