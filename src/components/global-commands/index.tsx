import React from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Settings, Terminal } from "lucide-react";
import { useTerminalStore } from "@/stores/terminal";
import { useProjectStore } from "@/stores/project";

interface GlobalCommandsProps {
  onOpenSettings?: () => void;
}

export default function GlobalCommands({ onOpenSettings }: GlobalCommandsProps) {
  const [focused, setFocused] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const { isVisible: isTerminalVisible, setVisible: setTerminalVisible, tabs, createTab } = useTerminalStore();
  const { currentProject } = useProjectStore();

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
    setFocused(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xs min-w-[350px]">
      <Command>
        <CommandInput
          placeholder="Global Commands (soon)"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {focused && (
          <div className="absolute left-0 right-0 top-10 border rounded-md z-50 mt-1 w-full bg-background/50 backdrop-blur-sm">
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandSeparator />
              <CommandGroup heading="Terminal">
                <CommandItem onSelect={handleToggleTerminal}>
                  <Terminal className="mr-2 h-4 w-4" />
                  {isTerminalVisible ? 'Hide Terminal' : 'Show Terminal'}
                  <CommandShortcut>⌘`</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Settings">
                <CommandItem 
                  onSelect={() => {
                    onOpenSettings?.();
                    setFocused(false);
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                  <CommandShortcut>⌘,</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  );
}
