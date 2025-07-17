import { exposeThemeContext } from "./theme/theme-context";
import { exposeWindowContext } from "./window/window-context";
import { exposeProjectContext } from "./project/project-context";
import { exposeAIContext } from "./ai/ai-context";
import { exposeAgentContext } from "./agents/agent-context";
import { exposeSettingsContext } from "./settings/settings-context";
import { exposeGitContext } from "./git/git-context";
import { exposeTerminalContext } from "./terminal/terminal-context";
import { exposeShellContext } from "./shell/shell-context";
import { exposeMCPContext } from "./mcp/mcp-context";

export default function exposeContexts() {
  exposeWindowContext();
  exposeThemeContext();
  exposeProjectContext();
  exposeAIContext();
  exposeAgentContext();
  exposeSettingsContext();
  exposeGitContext();
  exposeTerminalContext();
  exposeShellContext();
  exposeMCPContext();
}
