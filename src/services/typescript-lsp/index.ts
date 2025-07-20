// TypeScript Language Server integration for Monaco Editor
// This replaces the slow and buggy manual TypeScript project service

export { typescriptLSPClient } from './typescript-lsp-client';
export { registerLSPProviders, MonacoLSPProvider } from './monaco-lsp-provider';
export type {
  LSPPosition,
  LSPRange,
  LSPDiagnostic,
  LSPCompletionItem,
  LSPHoverInfo,
  LSPLocation,
} from './typescript-lsp-client';
