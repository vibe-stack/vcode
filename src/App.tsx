import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";
import { syncThemeWithLocal } from "./helpers/theme_helpers";
import { useTranslation } from "react-i18next";
import "./localization/i18n";
import { updateAppLanguage } from "./helpers/language_helpers";
import { router } from "./routes/router";
import { RouterProvider } from "@tanstack/react-router";
import { useProjectStore } from "./stores/project";

export default function App() {
  const { i18n } = useTranslation();
  const { autoOpenLastProject } = useProjectStore();

  useEffect(() => {
    syncThemeWithLocal();
    updateAppLanguage(i18n);
    
    // Auto-open last project on startup (temporarily disabled)
    // autoOpenLastProject();
  }, [i18n, autoOpenLastProject]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

const root = createRoot(document.getElementById("app")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
