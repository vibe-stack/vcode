import * as monaco from 'monaco-editor';
import { typescriptLSPClient, registerLSPProviders } from '@/services/typescript-lsp';

// Enhanced language configurations for better syntax highlighting
export const enhanceMonacoLanguages = () => {
    // JSON configuration with better error reporting
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: false,
        schemas: [],
        enableSchemaRequest: true,
        schemaRequest: 'warning',
        schemaValidation: 'warning',
        comments: 'error',
        trailingCommas: 'error',
    });

    // Disable Monaco's built-in TypeScript service - we'll use LSP instead
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,  // Disable - LSP will handle this
        noSyntaxValidation: false,   // Keep basic syntax validation as fallback
        noSuggestionDiagnostics: true, // Disable - LSP will handle this
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,  // Disable - LSP will handle this
        noSyntaxValidation: false,   // Keep basic syntax validation as fallback
        noSuggestionDiagnostics: true, // Disable - LSP will handle this
    });

    // Set basic TypeScript configuration (LSP will override with project-specific settings)
    setDefaultTypeScriptConfiguration();
    
    // Register LSP providers for advanced TypeScript features
    registerLSPProviders();

    // CSS configuration with vendor prefixes support
    monaco.languages.css.cssDefaults.setOptions({
        validate: true,
        lint: {
            compatibleVendorPrefixes: 'ignore',
            vendorPrefix: 'warning',
            duplicateProperties: 'warning',
            emptyRules: 'warning',
            importStatement: 'ignore',
            boxModel: 'ignore',
            universalSelector: 'ignore',
            zeroUnits: 'ignore',
            fontFaceProperties: 'warning',
            hexColorLength: 'error',
            argumentsInColorFunction: 'error',
            unknownProperties: 'warning',
            ieHack: 'ignore',
            unknownVendorSpecificProperties: 'ignore',
            propertyIgnoredDueToDisplay: 'warning',
            important: 'ignore',
            float: 'ignore',
            idSelector: 'ignore',
        },
    });

    // SCSS/SASS configuration
    monaco.languages.css.scssDefaults.setOptions({
        validate: true,
        lint: {
            compatibleVendorPrefixes: 'ignore',
            vendorPrefix: 'warning',
            duplicateProperties: 'warning',
            emptyRules: 'warning',
            importStatement: 'ignore',
            boxModel: 'ignore',
            universalSelector: 'ignore',
            zeroUnits: 'ignore',
            fontFaceProperties: 'warning',
            hexColorLength: 'error',
            argumentsInColorFunction: 'error',
            unknownProperties: 'warning',
            ieHack: 'ignore',
            unknownVendorSpecificProperties: 'ignore',
            propertyIgnoredDueToDisplay: 'warning',
            important: 'ignore',
            float: 'ignore',
            idSelector: 'ignore',
        },
    });

    // HTML configuration
    monaco.languages.html.htmlDefaults.setOptions({
        format: {
            tabSize: 2,
            insertSpaces: true,
            wrapLineLength: 120,
            unformatted: 'default',
            contentUnformatted: 'pre,code,textarea',
            indentInnerHtml: false,
            preserveNewLines: true,
            maxPreserveNewLines: 2,
            indentHandlebars: false,
            endWithNewline: false,
            extraLiners: 'head, body, /html',
            wrapAttributes: 'auto',
        },
        suggest: {
            html5: true,
            angular1: false,
            ionic: false,
        },
        // validate: true, // This option might not be available in this Monaco version
    });
};

/**
 * Set default TypeScript configuration when no project-specific config is available
 */
const setDefaultTypeScriptConfiguration = () => {
    // Default TypeScript/JavaScript configuration
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        noEmit: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        reactNamespace: 'React',
        allowJs: true,
        strict: false, // Set to false initially to reduce errors
        skipLibCheck: true,
        lib: ['DOM', 'ES2022'],
        typeRoots: ['node_modules/@types'],
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        noEmit: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        allowJs: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        checkJs: false,
    });
};

/**
 * Initialize TypeScript LSP for the current project
 */
export const initializeTypeScriptProject = async (projectPath: string) => {
    try {
        // Wait for the app to be fully ready before initializing LSP
        // This helps avoid the initialization timing issues
        let retries = 10;
        while (retries > 0 && !window.electronAPI?.typescriptLSP) {
            await new Promise(resolve => setTimeout(resolve, 500));
            retries--;
        }
        
        if (!window.electronAPI?.typescriptLSP) {
            return false;
        }
        
        const success = await typescriptLSPClient.initialize(projectPath);
        if (success) {
            // noop
        } else {
            console.error('Failed to initialize TypeScript LSP for project:', projectPath);
        }
        return success;
    } catch (error) {
        console.error('Error initializing TypeScript LSP:', error);
        return false;
    }
};

// Custom language registration for common file types not supported by default
export const registerCustomLanguages = () => {
    // Register .env files
    monaco.languages.register({ id: 'dotenv' });
    monaco.languages.setMonarchTokensProvider('dotenv', {
        tokenizer: {
            root: [
                [/#.*/, 'comment'],
                [/\w+(?==)/, 'key'],
                [/=/, 'delimiter'],
                [/.*/, 'value'],
            ],
        },
    });

    // Register .gitignore files
    monaco.languages.register({ id: 'gitignore' });
    monaco.languages.setMonarchTokensProvider('gitignore', {
        tokenizer: {
            root: [
                [/#.*/, 'comment'],
                [/^\!/, 'operator'],
                [/\*/, 'wildcard'],
                [/.*/, 'path'],
            ],
        },
    });

    // Register .log files with simple highlighting
    monaco.languages.register({ id: 'log' });
    monaco.languages.setMonarchTokensProvider('log', {
        tokenizer: {
            root: [
                [/\[[^\]]*\]/, 'tag'],
                [/\d{4}-\d{2}-\d{2}/, 'date'],
                [/\d{2}:\d{2}:\d{2}/, 'time'],
                [/(ERROR|FATAL|CRITICAL)/, 'error'],
                [/(WARN|WARNING)/, 'warning'],
                [/(INFO|DEBUG|TRACE)/, 'info'],
                [/.*/, 'text'],
            ],
        },
    });
};

// Map common file extensions to custom languages
export const getCustomLanguageFromExtension = (extension: string): string | null => {
    const customMappings: Record<string, string> = {
        'env': 'dotenv',
        'gitignore': 'gitignore',
        'log': 'log',
        'conf': 'ini',
        'cfg': 'ini',
        'toml': 'ini', // Use INI highlighting for TOML files as a fallback
    };

    return customMappings[extension.toLowerCase()] || null;
};
