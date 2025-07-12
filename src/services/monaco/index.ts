import { useEffect, useRef } from 'react';
import { initialize } from '@codingame/monaco-vscode-api';
import { RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override';

// Import monaco editor types from original monaco-editor for types
import type * as MonacoTypes from 'monaco-editor';

// Service overrides
import getBaseServiceOverride from '@codingame/monaco-vscode-base-service-override';
import getHostServiceOverride from '@codingame/monaco-vscode-host-service-override';
import getExtensionsServiceOverride from '@codingame/monaco-vscode-extensions-service-override';
import getFilesServiceOverride from '@codingame/monaco-vscode-files-service-override';
import getQuickAccessServiceOverride from '@codingame/monaco-vscode-quickaccess-service-override';
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override';
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override';
import getSearchServiceOverride from '@codingame/monaco-vscode-search-service-override';
import getEditorServiceOverride from '@codingame/monaco-vscode-editor-service-override';

//@ts-expect-error
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

export interface MonacoEditorInstance {
    id: string;
    bufferId: string;
    editor: MonacoTypes.editor.IStandaloneCodeEditor;
    containerElement: HTMLElement;
    modelRef?: any; // Use any for now as ITextModelReference is enhanced in monaco-vscode-api
    fileSystemProvider?: RegisteredFileSystemProvider;
    overlayDisposable?: { dispose(): void };
}

// Global initialization state
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;
let monaco: any = null; // Will be set after initialization

/**
 * Initialize Monaco VSCode API services
 */
async function initializeMonacoServices(): Promise<void> {
    console.log('initializeMonacoServices: Starting, isInitialized:', isInitialized, 'initializationPromise:', !!initializationPromise);
    
    if (isInitialized) return;
    if (initializationPromise) return initializationPromise;

    initializationPromise = (async () => {
        console.log('initializeMonacoServices: Configuring Monaco Environment...');
        
        // Configure Monaco Environment
        window.MonacoEnvironment = {
            getWorker(_workerId: any, label: string) {
                return new editorWorker();
            }
        };

        console.log('initializeMonacoServices: Initializing VSCode services...');
        
        // Initialize VSCode services
        await initialize({
            ...getBaseServiceOverride(),
            ...getHostServiceOverride(),
            ...getExtensionsServiceOverride(),
            ...getFilesServiceOverride(),
            ...getQuickAccessServiceOverride(),
            ...getThemeServiceOverride(),
            ...getConfigurationServiceOverride(),
            ...getKeybindingsServiceOverride(),
            ...getLanguagesServiceOverride(),
            ...getTextmateServiceOverride(),
            ...getSearchServiceOverride(),
            // Skip editor service override for now as it requires specific configuration
        });

        // Import the enhanced monaco instance after initialization
        monaco = await import('monaco-editor');

        console.log('initializeMonacoServices: VSCode services initialized successfully');
        isInitialized = true;
    })();

    return initializationPromise;
}

/**
 * Get the enhanced Monaco instance (only available after initialization)
 */
function getMonaco() {
    if (!monaco) {
        throw new Error('Monaco services not initialized yet. Initialization is in progress...');
    }
    return monaco;
}

class MonacoEditorRegistry {
    private editors = new Map<string, MonacoEditorInstance>();
    private editorsByBuffer = new Map<string, string>(); // bufferId -> editorId

    constructor() {
        // Ensure Monaco services are initialized
        console.log('MonacoEditorRegistry: Starting initialization...');
        initializeMonacoServices().then(() => {
            console.log('Monaco services initialized successfully');
        }).catch(err => {
            console.error('Failed to initialize Monaco services:', err);
        });
    }
    /**
     * Create and register a new Monaco Editor instance
     */
    async createEditor(
        bufferId: string,
        container: HTMLElement,
        options: MonacoTypes.editor.IStandaloneEditorConstructionOptions = {},
        fileContent?: string,
        language?: string,
        filePath?: string
    ): Promise<MonacoTypes.editor.IStandaloneCodeEditor> {
        console.log('createEditor: Starting for buffer:', bufferId);
        
        // Wait for Monaco services to be initialized (started in constructor)
        console.log('createEditor: Waiting for Monaco services initialization...');
        if (initializationPromise) {
            await initializationPromise;
        }
        console.log('createEditor: Monaco services ready, creating editor...');

        // Ensure we have the enhanced monaco instance
        if (!monaco) {
            throw new Error('Monaco instance not available after initialization');
        }
        
        const editorId = `editor_${bufferId}_${Date.now()}`;
        let modelRef: any; // Enhanced model reference from monaco-vscode-api
        let fileSystemProvider: RegisteredFileSystemProvider | undefined;
        let overlayDisposable: { dispose(): void } | undefined;

        // Create editor with VSCode integration
        let editor: MonacoTypes.editor.IStandaloneCodeEditor;

        if (fileContent !== undefined && filePath) {
            // Create a file in the virtual filesystem and use createModelReference
            const fileUri = monaco.Uri.file(filePath);

            fileSystemProvider = new RegisteredFileSystemProvider(false);
            fileSystemProvider.registerFile(new RegisteredMemoryFile(fileUri, fileContent));
            overlayDisposable = registerFileSystemOverlay(1, fileSystemProvider);

            // Use createModelReference for better VSCode integration
            modelRef = await monaco.editor.createModelReference(fileUri);

            editor = monaco.editor.create(container, {
                model: modelRef.object.textEditorModel,
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                fontSize: 14,
                fontFamily: 'Geist Mono, Monaco, "Lucida Console", monospace',
                ...options,
            });
        } else {
            // Fallback to traditional model creation
            editor = monaco.editor.create(container, {
                value: fileContent || '',
                language: language || 'plaintext',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                fontSize: 14,
                fontFamily: 'Geist Mono, Monaco, "Lucida Console", monospace',
                ...options,
            });
        }

        const editorInstance: MonacoEditorInstance = {
            id: editorId,
            bufferId,
            editor,
            containerElement: container,
            modelRef,
            fileSystemProvider,
            overlayDisposable,
        };

        this.editors.set(editorId, editorInstance);
        this.editorsByBuffer.set(bufferId, editorId);

        console.log('createEditor: Editor created successfully for buffer:', bufferId, 'with ID:', editorId);
        return editor;
    }

    /**
     * Create an editor with file system integration
     */
    async createEditorWithFile(
        bufferId: string,
        container: HTMLElement,
        filePath: string,
        content: string,
        language?: string,
        options: MonacoTypes.editor.IStandaloneEditorConstructionOptions = {}
    ): Promise<MonacoTypes.editor.IStandaloneCodeEditor> {
        return this.createEditor(bufferId, container, options, content, language, filePath);
    }

    /**
     * Update file content in the virtual filesystem
     */
    async updateFileContent(bufferId: string, content: string): Promise<void> {
        const editorInstance = this.getEditorInstanceByBuffer(bufferId);
        if (editorInstance?.modelRef) {
            // Update the model content directly
            editorInstance.editor.setValue(content);
        }
    }

    /**
     * Save file content (for files created with createModelReference)
     */
    async saveFile(bufferId: string): Promise<void> {
        const editorInstance = this.getEditorInstanceByBuffer(bufferId);
        if (editorInstance?.modelRef?.object?.save) {
            await editorInstance.modelRef.object.save();
        }
    }

    /**
     * Check if file has unsaved changes
     */
    isFileDirty(bufferId: string): boolean {
        const editorInstance = this.getEditorInstanceByBuffer(bufferId);
        if (editorInstance?.modelRef?.object?.isDirty) {
            return editorInstance.modelRef.object.isDirty();
        }
        return false;
    }

    /**
     * Get the file URI for an editor
     */
    getFileUri(bufferId: string): MonacoTypes.Uri | null {
        const editorInstance = this.getEditorInstanceByBuffer(bufferId);
        if (editorInstance?.modelRef?.object?.textEditorModel?.uri) {
            return editorInstance.modelRef.object.textEditorModel.uri;
        }
        return null;
    }

    /**
     * Get available languages
     */
    getAvailableLanguages(): string[] {
        return monaco.languages.getLanguages().map((lang: any) => lang.id);
    }

    /**
     * Set editor theme
     */
    setTheme(theme: string): void {
        monaco.editor.setTheme(theme);
    }

    /**
     * Get all available themes
     */
    getAvailableThemes(): string[] {
        // Common VSCode themes that should be available with the theme service
        return ['vs', 'vs-dark', 'hc-black', 'hc-light'];
    }

    /**
     * Get an editor instance by editor ID
     */
    getEditor(editorId: string): MonacoTypes.editor.IStandaloneCodeEditor | null {
        return this.editors.get(editorId)?.editor || null;
    }

    /**
     * Get an editor instance by buffer ID
     */
    getEditorByBuffer(bufferId: string): MonacoTypes.editor.IStandaloneCodeEditor | null {
        const editorId = this.editorsByBuffer.get(bufferId);
        return editorId ? this.getEditor(editorId) : null;
    }

    /**
     * Get the editor instance data by buffer ID
     */
    getEditorInstanceByBuffer(bufferId: string): MonacoEditorInstance | null {
        const editorId = this.editorsByBuffer.get(bufferId);
        return editorId ? this.editors.get(editorId) || null : null;
    }

    /**
     * Get all editor instances
     */
    getAllEditors(): MonacoEditorInstance[] {
        return Array.from(this.editors.values());
    }

    /**
     * Dispose of an editor instance
     */
    disposeEditor(bufferId: string): void {
        const editorId = this.editorsByBuffer.get(bufferId);
        if (editorId) {
            const editorInstance = this.editors.get(editorId);
            if (editorInstance) {
                // Dispose model reference if it exists
                if (editorInstance.modelRef) {
                    editorInstance.modelRef.dispose();
                }

                // Dispose overlay if it exists
                if (editorInstance.overlayDisposable) {
                    editorInstance.overlayDisposable.dispose();
                }

                // Dispose editor
                editorInstance.editor.dispose();

                this.editors.delete(editorId);
                this.editorsByBuffer.delete(bufferId);
            }
        }
    }

    /**
     * Dispose all editors
     */
    disposeAllEditors(): void {
        this.editors.forEach((instance) => {
            // Dispose model reference if it exists
            if (instance.modelRef) {
                instance.modelRef.dispose();
            }

            // Dispose overlay if it exists
            if (instance.overlayDisposable) {
                instance.overlayDisposable.dispose();
            }

            // Dispose editor
            instance.editor.dispose();
        });
        this.editors.clear();
        this.editorsByBuffer.clear();
    }

    /**
     * Focus an editor by buffer ID
     */
    focusEditor(bufferId: string): void {
        const editor = this.getEditorByBuffer(bufferId);
        if (editor) {
            editor.focus();
        }
    }

    /**
     * Update the model of an editor
     */
    updateEditorModel(
        bufferId: string,
        content: string,
        language?: string,
        uri?: MonacoTypes.Uri
    ): void {
        const editor = this.getEditorByBuffer(bufferId);
        if (editor) {
            const model = monaco.editor.createModel(content, language, uri);
            editor.setModel(model);
        }
    }

    /**
     * Get the current value of an editor
     */
    getEditorValue(bufferId: string): string | null {
        const editor = this.getEditorByBuffer(bufferId);
        return editor ? editor.getValue() : null;
    }

    /**
     * Set the value of an editor
     */
    setEditorValue(bufferId: string, value: string): void {
        const editor = this.getEditorByBuffer(bufferId);
        if (editor) {
            editor.setValue(value);
        }
    }

    /**
     * Get the cursor position of an editor
     */
    getEditorCursorPosition(bufferId: string): MonacoTypes.Position | null {
        const editor = this.getEditorByBuffer(bufferId);
        return editor ? editor.getPosition() : null;
    }

    /**
     * Set the cursor position of an editor
     */
    setEditorCursorPosition(bufferId: string, position: MonacoTypes.Position): void {
        const editor = this.getEditorByBuffer(bufferId);
        if (editor) {
            editor.setPosition(position);
        }
    }

    /**
     * Restore cursor position from buffer state
     */
    restoreCursorPosition(bufferId: string, line: number, column: number): void {
        const editor = this.getEditorByBuffer(bufferId);
        if (editor) {
            // Monaco uses 1-based line numbers and 1-based column numbers
            editor.setPosition({ lineNumber: line + 1, column: column + 1 });
        }
    }

    /**
     * Get scroll position of an editor
     */
    getEditorScrollPosition(bufferId: string): { top: number; left: number } | null {
        const editor = this.getEditorByBuffer(bufferId);
        if (editor) {
            const scrollTop = editor.getScrollTop();
            const scrollLeft = editor.getScrollLeft();
            return { top: scrollTop, left: scrollLeft };
        }
        return null;
    }

    /**
     * Set scroll position of an editor
     */
    setEditorScrollPosition(bufferId: string, top: number, left: number): void {
        const editor = this.getEditorByBuffer(bufferId);
        if (editor) {
            editor.setScrollTop(top);
            editor.setScrollLeft(left);
        }
    }

    /**
     * Get the enhanced Monaco instance (safe method)
     */
    getMonaco() {
        return getMonaco();
    }
}

// Export singleton instance
export const monacoEditorRegistry = new MonacoEditorRegistry();

// Export types for external use
export type { MonacoTypes };

// Export VSCode API functionality
export { initialize, RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay };

// Export enhanced hooks
export { useEnhancedMonacoEditor, useSimpleMonacoEditor } from './hooks';

/**
 * Enhanced Monaco Editor Registry with VSCode services
 */

/**
 * React hook for using Monaco Editor with the registry
 */
export function useMonacoEditor(bufferId: string) {
    const editorRef = useRef<MonacoTypes.editor.IStandaloneCodeEditor | null>(null);

    useEffect(() => {
        // Get existing editor from registry
        const existingEditor = monacoEditorRegistry.getEditorByBuffer(bufferId);
        if (existingEditor) {
            editorRef.current = existingEditor;
        }
    }, [bufferId]);

    return {
        editor: editorRef.current,
        registry: monacoEditorRegistry,
        getEditor: () => monacoEditorRegistry.getEditorByBuffer(bufferId),
        focusEditor: () => monacoEditorRegistry.focusEditor(bufferId),
        getValue: () => monacoEditorRegistry.getEditorValue(bufferId),
        setValue: (value: string) => monacoEditorRegistry.setEditorValue(bufferId, value),
        getCursorPosition: () => monacoEditorRegistry.getEditorCursorPosition(bufferId),
        setCursorPosition: (position: MonacoTypes.Position) => monacoEditorRegistry.setEditorCursorPosition(bufferId, position),
        getScrollPosition: () => monacoEditorRegistry.getEditorScrollPosition(bufferId),
        setScrollPosition: (top: number, left: number) => monacoEditorRegistry.setEditorScrollPosition(bufferId, top, left),
        // Enhanced methods with VSCode API integration
        initializeServices: () => initializeMonacoServices(),
        isInitialized: () => isInitialized,
    };
}
