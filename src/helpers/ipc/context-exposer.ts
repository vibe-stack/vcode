import { exposeThemeContext } from "./theme/theme-context";
import { exposeWindowContext } from "./window/window-context";
import { exposeProjectContext } from "./project/project-context";

export default function exposeContexts() {
  exposeWindowContext();
  exposeThemeContext();
  exposeProjectContext();
}
