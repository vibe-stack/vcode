import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { syncThemeWithLocal } from "./helpers/theme_helpers";
import { useTranslation } from "react-i18next";
import "./localization/i18n";
import { updateAppLanguage } from "./helpers/language_helpers";
import { router } from "./routes/router";
import { RouterProvider } from "@tanstack/react-router";
import { useProjectStore } from "./stores/project";
import { useSettingsStore } from "./stores/settings";
import "./services/mcp-integration"; // Initialize MCP integration

export default function App() {
  const { i18n } = useTranslation();
  const { autoOpenLastProject } = useProjectStore();
  const { initialize } = useSettingsStore();

  useEffect(() => {
    // Initialize settings store first
    const initializeApp = async () => {
      await initialize();

      // Get fresh settings after initialization
      const settingsStore = useSettingsStore.getState();
      const currentSettings = settingsStore.settings;

      // Apply saved theme and font settings
      const root = document.documentElement;
      const theme = currentSettings.appearance?.theme || "dark";

      // Apply theme
      root.classList.remove("dark", "dimmed", "tinted");
      if (theme !== "light") {
        root.classList.add(theme);
      }

      // Apply font settings
      const fontMap: Record<string, string> = {
        system:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        inter: "Inter, sans-serif",
        helvetica: "Helvetica, Arial, sans-serif",
        arial: "Arial, sans-serif",
        segoe: '"Segoe UI", Tahoma, sans-serif',
        roboto: "Roboto, sans-serif",
        tektur: "Tektur, sans-serif",
      };

      const appFont = currentSettings.appearance?.font?.family || "system";
      const appFontSize = currentSettings.appearance?.font?.size || 14;
      const appFontBold = currentSettings.appearance?.font?.bold || false;

      if (appFont !== "system") {
        root.style.setProperty(
          "--font-sans",
          fontMap[appFont] || fontMap["system"],
        );
      }
      root.style.setProperty("--app-font-size", `${appFontSize}px`);
      root.style.setProperty("--app-font-weight", appFontBold ? "600" : "400");

      // Also apply code font settings
      const codeFont = currentSettings.editor?.font?.family || "sf-mono";
      const codeFontSize = currentSettings.editor?.font?.size || 13;
      const codeFontBold = currentSettings.editor?.font?.bold || false;

      const codeFontMap: Record<string, string> = {
        "sf-mono":
          "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace",
        "fira-code": "'Fira Code', 'Cascadia Code', 'SF Mono', monospace",
        jetbrains: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
        cascadia: "'Cascadia Code', 'Fira Code', 'SF Mono', monospace",
        "source-code-pro":
          "'Source Code Pro', 'SF Mono', 'Fira Code', monospace",
        "ubuntu-mono": "'Ubuntu Mono', 'SF Mono', monospace",
        consolas: "Consolas, 'SF Mono', monospace",
        menlo: "Menlo, 'SF Mono', monospace",
        monaco: "Monaco, 'SF Mono', monospace",
        courier: "'Courier New', Courier, monospace",
        tektur: "Tektur, 'SF Mono', Monaco, Menlo, monospace",
      };

      root.style.setProperty(
        "--font-mono",
        codeFontMap[codeFont] || codeFontMap["sf-mono"],
      );
      root.style.setProperty("--code-font-size", `${codeFontSize}px`);
      root.style.setProperty(
        "--code-font-weight",
        codeFontBold ? "600" : "400",
      );
    };

    initializeApp();
    syncThemeWithLocal();
    updateAppLanguage(i18n);

    // Auto-open last project on startup
    autoOpenLastProject();
  }, [i18n, autoOpenLastProject, initialize]);

  return <RouterProvider router={router} />;
}

const root = createRoot(document.getElementById("app")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
