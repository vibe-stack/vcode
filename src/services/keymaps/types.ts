export interface KeyBinding {
  /** Unique identifier for this key binding */
  id: string;
  /** Human-readable description of what this key binding does */
  description: string;
  /** Key combination that triggers this binding */
  key: string;
  /** Alternative key combinations (for different platforms) */
  altKeys?: string[];
  /** Command to execute when this key binding is triggered */
  command: string;
  /** Optional arguments to pass to the command */
  args?: any[];
  /** Context in which this key binding is active */
  context?: 'editor' | 'global' | 'explorer' | 'terminal';
  /** Whether this key binding is enabled */
  enabled: boolean;
  /** Category for organization */
  category: 'file' | 'edit' | 'view' | 'navigation' | 'debug' | 'terminal' | 'custom';
}

export interface KeymapProfile {
  /** Name of the keymap profile */
  name: string;
  /** Description of the keymap profile */
  description: string;
  /** List of key bindings in this profile */
  bindings: KeyBinding[];
  /** Whether this is the active profile */
  isActive: boolean;
}

export interface KeymapState {
  /** Available keymap profiles */
  profiles: KeymapProfile[];
  /** Currently active profile */
  activeProfile: string;
  /** Map of registered commands */
  commands: Map<string, KeyCommand>;
  /** Whether key mappings are enabled */
  enabled: boolean;
  
  // Actions
  /** Register a new command */
  registerCommand: (id: string, command: KeyCommand) => void;
  /** Unregister a command */
  unregisterCommand: (id: string) => void;
  /** Add a key binding */
  addKeyBinding: (binding: KeyBinding) => void;
  /** Remove a key binding */
  removeKeyBinding: (id: string) => void;
  /** Update a key binding */
  updateKeyBinding: (id: string, binding: Partial<KeyBinding>) => void;
  /** Set active profile */
  setActiveProfile: (profileName: string) => void;
  /** Handle key event */
  handleKeyEvent: (event: KeyboardEvent) => boolean;
  /** Get key binding by key combination */
  getKeyBinding: (key: string) => KeyBinding | null;
  /** Load keymap profile */
  loadProfile: (profile: KeymapProfile) => void;
  /** Save current profile */
  saveProfile: () => void;
  /** Reset to default profile */
  resetToDefault: () => void;
}

export interface KeyCommand {
  /** Function to execute */
  execute: (args?: any[]) => Promise<void> | void;
  /** Whether this command can be undone */
  canUndo?: boolean;
  /** Undo function */
  undo?: () => Promise<void> | void;
  /** Validation function to check if command can be executed */
  canExecute?: () => boolean;
}

export interface KeyEventInfo {
  /** The key that was pressed */
  key: string;
  /** Modifier keys that were pressed */
  modifiers: {
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
  };
  /** Full key combination string */
  combination: string;
  /** Original keyboard event */
  originalEvent: KeyboardEvent;
}
