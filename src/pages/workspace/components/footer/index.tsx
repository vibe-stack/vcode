import { useBufferStore } from "@/stores/buffers";
import { useProjectStore } from "@/stores/project";
import { detectLineEnding, detectIndentation, detectEncoding, getLanguageFromExtension } from "@/stores/buffers/utils";
import React from "react";

export function WorkspaceFooter() {
    const { } = useProjectStore();
    const { buffers, activeBufferId } = useBufferStore();

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
                    <div className="">main</div>

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