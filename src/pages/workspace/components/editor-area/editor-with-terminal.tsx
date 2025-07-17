import React from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { EditorArea } from "./editor-area";
import { TerminalPanel } from "../terminal";
import { useTerminalStore } from "@/stores/terminal";

export function EditorWithTerminal() {
  const { isVisible: isTerminalVisible } = useTerminalStore();

  if (!isTerminalVisible) {
    return <EditorArea />;
  }

  return (
    <ResizablePanelGroup direction="vertical" className="h-full">
      <ResizablePanel defaultSize={70} minSize={30}>
        <EditorArea />
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={30} minSize={15}>
        <TerminalPanel />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
