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

export default function registerListeners(mainWindow: BrowserWindow) {
  addWindowEventListeners(mainWindow);
  addThemeEventListeners();
  addProjectEventListeners(mainWindow);
  addAIEventListeners();
  addSettingsEventListeners();
  addGitEventListeners(mainWindow);
  addTerminalEventListeners(mainWindow);
  addAgentEventListeners(mainWindow);
  registerShellListeners();
}
