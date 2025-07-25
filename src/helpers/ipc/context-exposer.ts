import { exposeThemeContext } from "./theme/theme-context";
import { exposeWindowContext } from "./window/window-context";
import { exposeProjectContext } from "./project/project-context";
import { exposeAIContext } from "./ai/ai-context";
import { exposeSettingsContext } from "./settings/settings-context";
import { exposeGitContext } from "./git/git-context";
import { exposeTerminalContext } from "./terminal/terminal-context";
import { exposeShellContext } from "./shell/shell-context";
import { exposeAgentContext } from "./agents/agent-context";
import { exposeIndexContext } from "./index/index-context";
import { exposeTypescriptLSPContext } from "./typescript-lsp/typescript-lsp-context";
import { exposeAutoUpdaterContext } from "./auto-updater/auto-updater-context";

export default function exposeContexts() {
  exposeWindowContext();
  exposeThemeContext();
  exposeProjectContext();
  exposeAIContext();
  exposeSettingsContext();
  exposeGitContext();
  exposeTerminalContext();
  exposeShellContext();
  exposeAgentContext();
  exposeIndexContext();
  exposeTypescriptLSPContext();
  exposeAutoUpdaterContext();
}
