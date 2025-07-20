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
    commonjsOptions: {
      exclude: [
        'node_modules/node-pty/**',
        'node_modules/better-sqlite3/**',
        'node_modules/faiss-node/**',
        'node_modules/onnxruntime-node/**',
        'node_modules/@xenova/transformers/**',
        'node_modules/@mapbox/node-pre-gyp/**',
        'node_modules/bindings/**',
        'node_modules/nan/**'
      ]
    },
    rollupOptions: {
      external: [
        'node-pty',
        'node.pty',
        'electron',
        "fs",
        "path",
        "os",
        "child_process",
        "better-sqlite3",
        "sharp",
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
