// Monaco Environment Configuration for Web Workers
export function setupMonacoEnvironment() {
  // Check if we're in a browser environment
  if (typeof window === "undefined") return;

  // Setup Monaco Environment with proper worker configuration
  (window as any).MonacoEnvironment = {
    getWorkerUrl: function (moduleId: string, label: string) {
      // Use data URLs to avoid worker loading issues in Electron
      const workerCode = `
        importScripts('monaco-editor/min/vs/base/worker/workerMain.js');
      `;

      const blob = new Blob([workerCode], { type: "application/javascript" });
      return URL.createObjectURL(blob);
    },

    getWorker: function (_: string, label: string) {
      // Return null to disable web workers and run in main thread
      // This prevents the worker-related errors
      return null;
    },
  };
}
