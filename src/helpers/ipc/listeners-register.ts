import { BrowserWindow } from "electron";
import { addThemeEventListeners } from "./theme/theme-listeners";
import { addWindowEventListeners } from "./window/window-listeners";
import { addProjectEventListeners } from "./project/project-listeners";
import { addAIEventListeners } from "./ai/ai-listeners";
import { addSettingsEventListeners } from "./settings/settings-listeners";

export default function registerListeners(mainWindow: BrowserWindow) {
  addWindowEventListeners(mainWindow);
  addThemeEventListeners();
  addProjectEventListeners(mainWindow);
  addAIEventListeners();
  addSettingsEventListeners();
}
