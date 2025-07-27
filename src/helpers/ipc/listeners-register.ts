import { BrowserWindow } from "electron";
import { addThemeEventListeners } from "./theme/theme-listeners";
import { addWindowEventListeners } from "./window/window-listeners";
import { addProjectEventListeners } from "./project/project-listeners";
import { addAIEventListeners } from "./ai/ai-listeners";
import { addSettingsEventListeners } from "./settings/settings-listeners";
import { addGitEventListeners } from "./git/git-listeners";
import { addTerminalEventListeners } from "./terminal/terminal-listeners";
import { addAgentEventListeners } from "./agents/agent-listeners";
import { addIndexEventListeners } from "./index/index-listeners";
import registerShellListeners from "./shell/shell-listeners";
import { addTypescriptLSPEventListeners } from "./typescript-lsp/typescript-lsp-listeners";
import { addMapBuilderEventListeners } from "./map-builder/map-builder-listeners";

export default function registerListeners(mainWindow: BrowserWindow) {
  addWindowEventListeners(mainWindow);
  addThemeEventListeners();
  addProjectEventListeners(mainWindow);
  addAIEventListeners();
  addMapBuilderEventListeners();
  addSettingsEventListeners();
  addGitEventListeners(mainWindow);
  addTerminalEventListeners(mainWindow);
  addAgentEventListeners(mainWindow);
  addIndexEventListeners();
  addTypescriptLSPEventListeners(mainWindow);
  registerShellListeners();
}
