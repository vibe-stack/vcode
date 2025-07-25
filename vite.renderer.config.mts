import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Provide browser-safe polyfills for Node.js modules
      "node:async_hooks": path.resolve(__dirname, "src/polyfills/async-hooks.ts"),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  build: {
    rollupOptions: {
      external: ['node-pty',
        'electron',
        'electron-updater',
        "fs",
        "path",
        "os",
        "child_process",],
      output: {
        manualChunks: {
          monaco: ['monaco-editor']
        }
      }
    }
  },
  worker: {
    format: "es",
  },
  optimizeDeps: {
    exclude: ['electron', 'node-pty', 'electron-updater'],
    include: [
      'monaco-editor/esm/vs/editor/editor.api',
      'monaco-editor/esm/vs/editor/editor.worker',
      'monaco-editor/esm/vs/language/json/json.worker',
      'monaco-editor/esm/vs/language/css/css.worker',
      'monaco-editor/esm/vs/language/html/html.worker',
      'monaco-editor/esm/vs/language/typescript/ts.worker'
    ]
  },
});
