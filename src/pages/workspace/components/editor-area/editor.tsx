import React, { useRef, useEffect, useState } from "react";
import { BufferContent, useBufferStore } from "@/stores/buffers";
import { getLanguageFromExtension } from "@/stores/buffers/utils";
import { Editor as MonacoEditor, loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { monacoIntegration } from "@/config/monaco-integration";
import { performanceMonitor } from "@/config/monaco-performance";
import {
  defaultEditorConfig,
  getMonacoEditorOptions,
} from "@/config/monaco-config";
import { useSettingsStore } from "@/stores/settings";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === "json") {
      return new jsonWorker();
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new cssWorker();
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new htmlWorker();
    }
    if (label === "typescript" || label === "javascript") {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

loader.config({ monaco });

// Initialize Monaco integration
let monacoInitialized = false;
loader.init().then(async (monacoInstance) => {
  if (!monacoInitialized) {
    await monacoIntegration.initialize(defaultEditorConfig);
    monacoInitialized = true;
  }
});

export interface EditorProps {
  buffer: BufferContent;
  onChange: (content: string) => void;
}

export function Editor({ buffer, onChange }: EditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const saveBuffer = useBufferStore((s) => s.saveBuffer);
  const [performanceData, setPerformanceData] = useState<any>(null);

  // Get font settings from store
  const { settings } = useSettingsStore();
  const codeFontFamily = settings.editor?.font?.family || "sf-mono";
  const codeFontSize = settings.editor?.font?.size || 13;
  const codeFontBold = settings.editor?.font?.bold || false;

  // Setup Monaco Environment for web workers on mount
  useEffect(() => {
    // Initialize Monaco if not already done
    if (!monacoInitialized) {
      monacoIntegration.initialize(defaultEditorConfig);
    }

    // Update performance data periodically
    const perfInterval = setInterval(() => {
      setPerformanceData(performanceMonitor.getOverallPerformanceSummary());
    }, 5000);

    return () => {
      clearInterval(perfInterval);
    };
  }, []);

  const value =
    typeof buffer.content === "string"
      ? buffer.content
      : new TextDecoder().decode(buffer.content!);

  // Generate unique editor ID
  const editorId = `editor-${buffer.id}`;

  // Enhanced configuration based on file characteristics
  const editorConfig = {
    ...defaultEditorConfig,
    // Performance optimizations for large files
    minimap: buffer.fileSize && buffer.fileSize > 50000 ? false : true,
    // AI features based on file type
    ai: {
      ...defaultEditorConfig.ai,
      enabled: buffer.extension
        ? [
            "js",
            "ts",
            "jsx",
            "tsx",
            "py",
            "java",
            "cpp",
            "cs",
            "go",
            "rs",
          ].includes(buffer.extension)
        : false,
    },
    // Auto-save for editable files
    preferences: {
      ...defaultEditorConfig.preferences,
      autoSave: buffer.isEditable,
    },
  };

  const handleEditorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: any,
  ) => {
    try {
      editorRef.current = editor;

      // Check if editor and model are valid
      if (!editor || !editor.getModel()) {
        console.error("Editor is invalid or has no model");
        return;
      }

      const model = editor.getModel();
      if (!model) {
        console.error("Editor model is null");
        return;
      }

      // Get font settings from CSS variables for consistency
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);

      // Get font from CSS variable or use fallback
      let fontFamily = computedStyle.getPropertyValue("--font-mono").trim();
      if (!fontFamily) {
        // Fallback font map if CSS variable is not set
        const fontMap: Record<string, string> = {
          "sf-mono":
            "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace",
          "fira-code": "'Fira Code', 'Cascadia Code', 'SF Mono', monospace",
          jetbrains: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
          "jetbrains-mono":
            "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
          cascadia: "'Cascadia Code', 'Fira Code', 'SF Mono', monospace",
          "cascadia-code": "'Cascadia Code', 'Fira Code', 'SF Mono', monospace",
          "source-code-pro":
            "'Source Code Pro', 'SF Mono', 'Fira Code', monospace",
          "ubuntu-mono": "'Ubuntu Mono', 'SF Mono', monospace",
          consolas: "Consolas, 'SF Mono', monospace",
          menlo: "Menlo, 'SF Mono', monospace",
          monaco: "Monaco, 'SF Mono', monospace",
          courier: "'Courier New', Courier, monospace",
          tektur: "Tektur, 'SF Mono', Monaco, Menlo, monospace",
        };
        fontFamily = fontMap[codeFontFamily] || fontMap["sf-mono"];
      }

      // Get font size and weight from CSS variables
      const fontSize =
        parseInt(computedStyle.getPropertyValue("--code-font-size")) ||
        codeFontSize;
      const fontWeight =
        computedStyle.getPropertyValue("--code-font-weight") || "400";

      editor.updateOptions({
        fontFamily: fontFamily,
        fontSize: fontSize,
        fontWeight: fontWeight,
      });

      // Focus the editor
      editor.focus();
    } catch (error) {
      console.error("Error in handleEditorDidMount:", error);
    }

    // Register editor with Monaco integration for enhanced features
    try {
      monacoIntegration.registerEditor(editorId, editor);

      // Add enhanced keybindings
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        console.log("Save triggered");
        saveBuffer(buffer.id);
      });

      // Format document keybinding
      editor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
        () => {
          if (!editor.isDisposed() && editor.getModel()) {
            editor.getAction("editor.action.formatDocument")?.run();
          }
        },
      );

      // AI completion keybinding
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
        if (!editor.isDisposed() && editor.getModel()) {
          editor.getAction("editor.action.triggerSuggest")?.run();
        }
      });

      // Quick fix keybinding
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Period, () => {
        if (!editor.isDisposed() && editor.getModel()) {
          editor.getAction("editor.action.quickFix")?.run();
        }
      });
    } catch (error) {
      console.error("Error registering editor commands:", error);
    }
  };

  // Update editor when font settings change
  useEffect(() => {
    const updateEditorFromEvent = (event: CustomEvent) => {
      if (
        editorRef.current &&
        typeof editorRef.current.updateOptions === "function"
      ) {
        const computedStyle = getComputedStyle(document.documentElement);

        // Use the NEW values from the event, fallback to CSS variables
        const fontSize =
          event.detail?.fontSize ||
          parseInt(computedStyle.getPropertyValue("--code-font-size")) ||
          13;
        const fontFamily =
          event.detail?.fontFamily ||
          computedStyle.getPropertyValue("--font-mono").trim() ||
          "'SF Mono', Monaco, monospace";
        const fontWeight =
          event.detail?.fontWeight ||
          computedStyle.getPropertyValue("--code-font-weight") ||
          "400";

        editorRef.current.updateOptions({
          fontFamily: fontFamily,
          fontSize: fontSize,
          fontWeight: fontWeight,
        });
      }
    };

    // Listen for font change events
    window.addEventListener(
      "editor-font-change",
      updateEditorFromEvent as EventListener,
    );

    return () => {
      window.removeEventListener(
        "editor-font-change",
        updateEditorFromEvent as EventListener,
      );
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        monacoIntegration.disposeEditor(editorId);
      }
    };
  }, [editorId]);

  return (
    <div className="relative flex h-full flex-col">
      {/* Loading/initializing overlay */}
      {buffer.isLoading && (
        <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      )}
      {/* Error overlay */}
      {buffer.error && (
        <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-2 text-sm">Error loading file</p>
            <p className="text-muted-foreground text-xs">{buffer.error}</p>
          </div>
        </div>
      )}
      {/* Readonly overlay */}
      {!buffer.isEditable && (
        <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-2 text-sm">
              Cannot edit {buffer.type} file
            </p>
            <p className="text-muted-foreground text-xs">
              File size:{" "}
              {buffer.fileSize
                ? `${Math.round(buffer.fileSize / 1024)}KB`
                : "Unknown"}
            </p>
          </div>
        </div>
      )}
      {/* Performance indicator */}
      {performanceData && performanceData.totalMemory > 100 * 1024 * 1024 && (
        <div className="absolute top-2 right-2 z-20 rounded bg-yellow-500 px-2 py-1 text-xs text-black">
          High memory usage:{" "}
          {Math.round(performanceData.totalMemory / 1024 / 1024)}MB
        </div>
      )}

      {/* Monaco Editor */}
      <MonacoEditor
        theme="dark-matrix"
        language={
          buffer.extension
            ? getLanguageFromExtension(buffer.extension)
            : "plaintext"
        }
        value={value}
        options={getMonacoEditorOptions(editorConfig)}
        onChange={(value) => {
          try {
            if (
              value !== undefined &&
              editorRef.current &&
              !editorRef.current.isDisposed()
            ) {
              onChange(value);
            }
          } catch (error) {
            console.error("Error in onChange:", error);
          }
        }}
        onMount={handleEditorDidMount}
        beforeMount={async (monaco) => {
          // Ensure Monaco integration is initialized
          if (!monacoInitialized) {
            await monacoIntegration.initialize(defaultEditorConfig);
            monacoInitialized = true;
          }
        }}
      />
    </div>
  );
}
