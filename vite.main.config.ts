import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  build: {
    rollupOptions: {
      external: [
        'node-pty',
        'electron',
        "fs",
        "path",
        "os",
        "child_process",
        "better-sqlite3",
        // Native modules for indexing
        "faiss-node",
        "onnxruntime-node",
        "@xenova/transformers",
        // Additional native dependencies that might be needed
        "@mapbox/node-pre-gyp",
        "bindings",
        "nan"
      ]
    }
  }
});
