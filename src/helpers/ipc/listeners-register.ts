import { BrowserWindow } from "electron";
import { addThemeEventListeners } from "./theme/theme-listeners";
import { addWindowEventListeners } from "./window/window-listeners";
import { addProjectEventListeners } from "./project/project-listeners";
import { addAIEventListeners } from "./ai/ai-listeners";
import { addAgentEventListeners } from "./agents/agent-listeners";
import { addSettingsEventListeners } from "./settings/settings-listeners";
import { addGitEventListeners } from "./git/git-listeners";
import { addTerminalEventListeners } from "./terminal/terminal-listeners";
import registerShellListeners from "./shell/shell-listeners";
import { addMCPEventListeners } from "./mcp/mcp-listeners";
import { addExtensionEventListeners } from "./extensions/extension-listeners";

export default function registerListeners(mainWindow: BrowserWindow) {
  console.log('📋 registerListeners called - starting to add all event listeners...')
  addWindowEventListeners(mainWindow);
  addThemeEventListeners();
  addProjectEventListeners(mainWindow);
  addAIEventListeners();
  addAgentEventListeners();
  addSettingsEventListeners();
  addGitEventListeners(mainWindow);
  addTerminalEventListeners(mainWindow);
  registerShellListeners();
  console.log('🔧 About to add MCP event listeners...')
  addMCPEventListeners();
  console.log('🔌 About to add Extension event listeners...')
  addExtensionEventListeners(mainWindow);
  console.log('✅ All event listeners registered successfully')
}
