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

interface GlobalCommandsProps {
  onOpenSettings?: () => void;
}

export default function GlobalCommands({ onOpenSettings }: GlobalCommandsProps) {
  const [focused, setFocused] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const { isVisible: isTerminalVisible, setVisible: setTerminalVisible } = useTerminalStore();

  const handleToggleTerminal = () => {
    setTerminalVisible(!isTerminalVisible);
    setFocused(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xs min-w-[350px]">
      <Command>
        <CommandInput
          placeholder="Type a command or search..."
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {focused && (
          <div className="absolute left-0 right-0 top-10 border rounded-md z-50 mt-1 w-full bg-background/50 backdrop-blur-sm">
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                <CommandItem>Calendar</CommandItem>
                <CommandItem>Search Emoji</CommandItem>
                <CommandItem>Calculator</CommandItem>
              </CommandGroup>
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
                <CommandItem>Profile</CommandItem>
                <CommandItem>Billing</CommandItem>
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
