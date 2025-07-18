// Terminal registry to keep terminal instances alive outside of React lifecycle
export interface PersistentTerminal {
  id: string;
  domElement: HTMLElement | null;
  isVisible: boolean;
  terminalInstance: any; // XTerm instance
}

class TerminalRegistry {
  private terminals = new Map<string, PersistentTerminal>();
  private container: HTMLElement | null = null;

  // Set the main container where terminals will be mounted
  setContainer(container: HTMLElement) {
    this.container = container;
  }

  // Create or get a terminal instance
  createTerminal(id: string): PersistentTerminal {
    if (this.terminals.has(id)) {
      return this.terminals.get(id)!;
    }

    const terminal: PersistentTerminal = {
      id,
      domElement: null,
      isVisible: false,
      terminalInstance: null
    };

    this.terminals.set(id, terminal);
    return terminal;
  }

  // Show a terminal by mounting it to a specific container
  showTerminal(id: string, targetContainer: HTMLElement): boolean {
    const terminal = this.terminals.get(id);
    if (!terminal || !terminal.domElement) {
      return false;
    }

    // Move the terminal DOM element to the target container
    if (terminal.domElement.parentNode !== targetContainer) {
      targetContainer.appendChild(terminal.domElement);
    }

    terminal.isVisible = true;
    
    // Trigger resize if terminal instance exists
    if (terminal.terminalInstance && typeof terminal.terminalInstance.fit === 'function') {
      terminal.terminalInstance.fit();
    }

    return true;
  }

  // Hide a terminal by moving it to the hidden container
  hideTerminal(id: string): boolean {
    const terminal = this.terminals.get(id);
    if (!terminal || !terminal.domElement || !this.container) {
      return false;
    }

    // Move to hidden container
    this.container.appendChild(terminal.domElement);
    terminal.isVisible = false;

    return true;
  }

  // Set the DOM element for a terminal
  setTerminalElement(id: string, element: HTMLElement, terminalInstance?: any) {
    const terminal = this.terminals.get(id);
    if (!terminal) {
      return false;
    }

    terminal.domElement = element;
    terminal.terminalInstance = terminalInstance;

    // If we have a container and terminal should be hidden, move it there
    if (this.container && !terminal.isVisible) {
      this.container.appendChild(element);
    }

    return true;
  }

  // Get terminal info
  getTerminal(id: string): PersistentTerminal | undefined {
    return this.terminals.get(id);
  }

  // Remove a terminal completely
  removeTerminal(id: string): boolean {
    const terminal = this.terminals.get(id);
    if (!terminal) {
      return false;
    }

    // Remove DOM element
    if (terminal.domElement && terminal.domElement.parentNode) {
      terminal.domElement.parentNode.removeChild(terminal.domElement);
    }

    // Cleanup terminal instance
    if (terminal.terminalInstance && typeof terminal.terminalInstance.dispose === 'function') {
      terminal.terminalInstance.dispose();
    }

    this.terminals.delete(id);
    return true;
  }

  // Get all terminal IDs
  getAllTerminalIds(): string[] {
    return Array.from(this.terminals.keys());
  }

  // Check if terminal is visible
  isTerminalVisible(id: string): boolean {
    const terminal = this.terminals.get(id);
    return terminal?.isVisible || false;
  }
}

// Global terminal registry instance
export const terminalRegistry = new TerminalRegistry();
