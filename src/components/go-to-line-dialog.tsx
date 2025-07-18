import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBufferStore } from "@/stores/buffers";

interface GoToLineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoToLineDialog({ open, onOpenChange }: GoToLineDialogProps) {
  const [lineNumber, setLineNumber] = useState("");
  const { activeBufferId } = useBufferStore();

  const handleGoToLine = () => {
    const line = parseInt(lineNumber, 10);
    if (line && line > 0) {
      // TODO: Implement actual go to line functionality with Monaco
      console.log(`Going to line ${line}`);
      // For now, just close the dialog
      onOpenChange(false);
      setLineNumber("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleGoToLine();
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Go to Line</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="line-number" className="text-sm font-medium">
              Line number
            </label>
            <Input
              id="line-number"
              type="number"
              placeholder="Enter line number"
              value={lineNumber}
              onChange={(e) => setLineNumber(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGoToLine}
              disabled={!lineNumber || parseInt(lineNumber, 10) <= 0}
            >
              Go to Line
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}